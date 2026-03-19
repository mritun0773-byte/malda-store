import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  type ProductId = Nat;
  type Rupees = Nat;

  public type Product = {
    id : ProductId;
    name : Text;
    price : Rupees;
    image : ?Storage.ExternalBlob;
    active : Bool;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  // Map for products
  let products = Map.empty<ProductId, Product>();

  // Map for user profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  private func checkAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // Internal state
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  func seedInitialProducts() {
    if (products.isEmpty()) {
      products.add(1, {
        id = 1;
        name = "Water Bottle 1L";
        price = 20;
        image = null;
        active = true;
      });
      products.add(2, {
        id = 2;
        name = "Water Bottle 500ml";
        price = 10;
        image = null;
        active = true;
      });
      products.add(3, {
        id = 3;
        name = "Water Bottle 250ml";
        price = 5;
        image = null;
        active = true;
      });
      products.add(4, {
        id = 4;
        name = "Eggs 12pcs";
        price = 72;
        image = null;
        active = true;
      });
    };
  };

  // Init and seed products - public so it can be called on first deploy
  public shared ({ caller }) func init() : async () {
    switch (products.get(1)) {
      case (null) {
        seedInitialProducts();
      };
      case (?_) {};
    };
  };

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user: Principal) : async ?UserProfile {
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

  // Product management - Admin only
  public shared ({ caller }) func addProduct(id : ProductId, name : Text, price : Rupees) : async () {
    checkAdmin(caller);

    if (products.containsKey(id)) {
      switch (products.get(id)) {
        case (?existingProduct) {
          let updatedProduct = {
            existingProduct with
            name;
            price;
            active = true;
          };
          products.add(id, updatedProduct);
        };
        case (null) {};
      };
    } else {
      let newProduct = {
        id;
        name;
        price;
        image = null;
        active = true;
      };
      products.add(id, newProduct);
    };
  };

  public shared ({ caller }) func updateProduct(id : ProductId, name : Text, price : Rupees) : async () {
    checkAdmin(caller);

    switch (products.get(id)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?existingProduct) {
        if (not existingProduct.active) {
          Runtime.trap("Cannot update an inactive (soft deleted) product");
        };
        let updatedProduct = {
          existingProduct with
          name;
          price;
        };
        products.add(id, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : ProductId) : async () {
    checkAdmin(caller);

    switch (products.get(id)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?existingProduct) {
        let updatedProduct = {
          existingProduct with
          active = false;
        };
        products.add(id, updatedProduct);
      };
    };
  };

  // Public query - no authorization needed, returns only active products
  public query func getProducts() : async [Product] {
    products.values().toArray().filter(func(p) { p.active }).sort();
  };

  // Image management - Admin only
  public shared ({ caller }) func uploadProductImage(productId : ProductId, image : Storage.ExternalBlob) : async () {
    checkAdmin(caller);

    switch (products.get(productId)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?product) {
        let updatedProduct = {
          product with
          image = ?image;
        };
        products.add(productId, updatedProduct);
      };
    };
  };
};
