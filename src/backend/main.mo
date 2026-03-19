import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Order "mo:core/Order";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";



actor {
  public type GroceryCategory = {
    #produce;
    #meatAndSeafood;
    #dairyAndEggs;
    #bakery;
    #beverages;
  };

  public type Product = {
    id : Text;
    name : Text;
    description : Text;
    priceCents : Nat;
    category : GroceryCategory;
    imageUrl : Text;
    stockCount : Nat;
    unit : Text;
    rating : Float;
  };

  public type OrderStatus = {
    #pending;
    #confirmed;
    #delivering;
    #delivered;
    #cancelled;
  };

  public type OrderItem = {
    productId : Text;
    quantity : Nat;
    priceAtOrder : Nat;
  };

  public type Order = {
    id : Text;
    customerId : Principal;
    items : [OrderItem];
    totalAmount : Nat;
    deliveryAddress : Text;
    status : OrderStatus;
    createdAt : Time.Time;
    stripePaymentIntentId : Text;
    isCOD : Bool;
  };

  public type UserProfile = {
    name : Text;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Text.compare(p1.id, p2.id);
    };
  };

  module CompareOrder {
    public func compare(o1 : Order, o2 : Order) : Order.Order {
      Text.compare(o1.id, o2.id);
    };
  };

  // Data Stores
  let products = Map.empty<Text, Product>();
  let orders = Map.empty<Text, Order>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // State for COD support
  var cashOnDeliveryEnabled : Bool = true;

  // Include authorization system using the mixin approach
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Stripe integration
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // First-time admin setup: the first logged-in user can claim owner status
  var ownerPrincipal : ?Principal = null;

  // Helper: returns true for any authenticated (non-anonymous) caller
  func isAuthenticated(p : Principal) : Bool {
    not p.isAnonymous();
  };

  // Helper: check if a principal is admin (via role system OR owner claim)
  func isAdminPrincipal(p : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, p)) return true;
    switch (ownerPrincipal) {
      case (?owner) { owner == p };
      case null { false };
    };
  };

  // Allows first logged-in user to claim admin when no owner exists
  public shared ({ caller }) func claimAdminIfFirst() : async Bool {
    if (caller.isAnonymous()) return false;
    switch (ownerPrincipal) {
      case (?_) { false };
      case null {
        ownerPrincipal := ?caller;
        true;
      };
    };
  };

  // Returns true if owner/admin has been set
  public query func hasAnyAdmin() : async Bool {
    ownerPrincipal != null;
  };

  // Admin check for current caller (respects both role system and owner claim)
  public shared query ({ caller }) func isCallerAdminOrOwner() : async Bool {
    isAdminPrincipal(caller);
  };

  // ==================================
  // USER PROFILE MANAGEMENT
  // ==================================

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ==================================
  // STRIPE CONFIGURATION
  // ==================================

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only admins can set Stripe config");
    };
    stripeConfig := ?config;
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  // ==================================
  // CATEGORIES - PUBLIC
  // ==================================

  public query func getCategories() : async [GroceryCategory] {
    [
      #produce,
      #meatAndSeafood,
      #dairyAndEggs,
      #bakery,
      #beverages,
    ];
  };

  // ==================================
  // PRODUCT CRUD - ADMIN ONLY
  // ==================================

  public shared ({ caller }) func createProduct(product : Product) : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only admins can create products");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(productId);
  };

  // ==================================
  // PRODUCT QUERIES - PUBLIC
  // ==================================

  public query func getProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public query func getProductsByCategory(category : GroceryCategory) : async [Product] {
    products.values().toArray().filter(
      func(p) {
        p.category == category;
      }
    );
  };

  // ==================================
  // ORDER MANAGEMENT
  // ==================================

  public shared ({ caller }) func createOrder(items : [OrderItem], totalAmount : Nat, deliveryAddress : Text, stripePaymentIntentId : Text, isCOD : Bool) : async Text {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Please log in to place an order");
    };

    if (isCOD and not cashOnDeliveryEnabled) {
      Runtime.trap("Cash on delivery is currently disabled");
    };

    let orderId = "";
    let order : Order = {
      id = orderId;
      customerId = caller;
      items;
      totalAmount;
      deliveryAddress;
      status = #pending;
      createdAt = Time.now();
      stripePaymentIntentId;
      isCOD;
    };
    orders.add(orderId, order);
    orderId;
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, status : OrderStatus) : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrders() : async [Order] {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray().sort();
  };

  public query ({ caller }) func getOrdersByCustomer(customerId : Principal) : async [Order] {
    if (caller != customerId and not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().toArray().filter(
      func(o) {
        o.customerId == customerId;
      }
    );
  };

  // ==================================
  // STRIPE CHECKOUT
  // ==================================

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Please log in to checkout");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Please log in to check session status");
    };
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ==================================
  // CASH ON DELIVERY ADMIN CONTROL
  // ==================================

  public shared ({ caller }) func setCODEnabled(enabled : Bool) : async () {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Only admins can update COD state");
    };
    cashOnDeliveryEnabled := enabled;
  };

  public query func isCODEnabled() : async Bool {
    cashOnDeliveryEnabled;
  };
};
