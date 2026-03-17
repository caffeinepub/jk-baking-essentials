import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Persistent storage
  include MixinStorage();

  // Stripe configuration (initialized as null)
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Helper function to get current Stripe configuration, or trap if not set
  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set Stripe configuration");
    };
    stripeConfig := ?config;
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    let config = getStripeConfiguration();
    await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Marketplace data types and logic
  type Product = {
    id : Text;
    name : Text;
    description : Text;
    pricePaise : Nat;
    category : ProductCategory;
    stockQuantity : Nat;
  };

  type ProductCategory = {
    #floursGrains;
    #sweeteners;
    #fatsOils;
    #leaveningAgents;
    #flavorExtracts;
    #cakeMixes;
    #decoratingTools;
    #bakingEquipment;
  };

  module ProductCategory {
    public func toText(category : ProductCategory) : Text {
      switch (category) {
        case (#floursGrains) { "Flours & Grains" };
        case (#sweeteners) { "Sweeteners" };
        case (#fatsOils) { "Fats & Oils" };
        case (#leaveningAgents) { "Leavening Agents" };
        case (#flavorExtracts) { "Flavor & Extracts" };
        case (#cakeMixes) { "Cake Mixes" };
        case (#decoratingTools) { "Decorating Tools" };
        case (#bakingEquipment) { "Baking Equipment" };
      };
    };
  };

  type CartItem = {
    productId : Text;
    quantity : Nat;
  };

  type Order = {
    id : Text;
    userId : Principal;
    items : [OrderItem];
    totalAmountPaise : Nat;
    deliveryAddress : DeliveryAddress;
    deliveryOption : DeliveryOption;
    status : OrderStatus;
    createdAt : Time.Time;
    paymentIntentId : Text;
  };

  type OrderItem = {
    productId : Text;
    name : Text;
    pricePaise : Nat;
    quantity : Nat;
  };

  type DeliveryAddress = {
    name : Text;
    street : Text;
    city : Text;
    pincode : Text;
    phone : Text;
  };

  type DeliveryOption = {
    #standard;
    #express;
  };

  type OrderStatus = {
    #pending;
    #confirmed;
    #outForDelivery;
    #delivered;
    #cancelled;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  let products = Map.empty<Text, Product>();
  let carts = Map.empty<Principal, [CartItem]>();
  let orders = Map.empty<Text, Order>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let validPincodes = [
    "600085",
    "600017",
    "600032",
    "600028",
    "600020",
    "600018",
    "600041",
    "600014",
    "600024",
    "600035",
  ];

  var nextOrderId = 1;
  var nextProductId = 13;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
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

  // Admin: Seed products
  public shared ({ caller }) func seedProducts() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can seed products");
    };

    // Seed with sample data (images omitted)
    let seedData : [Product] = [
      {
        id = "1";
        name = "All Purpose Flour (Maida)";
        description = "1kg pack of premium all purpose flour";
        pricePaise = 8000;
        category = #floursGrains;
        stockQuantity = 50;
      },
      {
        id = "2";
        name = "Whole Wheat Flour";
        description = "1kg pack of whole wheat flour";
        pricePaise = 9500;
        category = #floursGrains;
        stockQuantity = 40;
      },
      {
        id = "3";
        name = "Organic Brown Sugar";
        description = "500g organic brown sugar";
        pricePaise = 7500;
        category = #sweeteners;
        stockQuantity = 30;
      },
      {
        id = "4";
        name = "Cocoa Powder";
        description = "250g premium cocoa powder";
        pricePaise = 12000;
        category = #flavorExtracts;
        stockQuantity = 20;
      },
      {
        id = "5";
        name = "Vanilla Extract";
        description = "60ml pure vanilla extract";
        pricePaise = 18000;
        category = #flavorExtracts;
        stockQuantity = 15;
      },
      {
        id = "6";
        name = "Baking Powder";
        description = "100g baking powder";
        pricePaise = 4000;
        category = #leaveningAgents;
        stockQuantity = 25;
      },
      {
        id = "7";
        name = "Active Dry Yeast";
        description = "100g active dry yeast";
        pricePaise = 6000;
        category = #leaveningAgents;
        stockQuantity = 20;
      },
      {
        id = "8";
        name = "Unsalted Butter";
        description = "500g unsalted butter";
        pricePaise = 32000;
        category = #fatsOils;
        stockQuantity = 10;
      },
      {
        id = "9";
        name = "Sunflower Oil";
        description = "1 litre cold pressed sunflower oil";
        pricePaise = 14000;
        category = #fatsOils;
        stockQuantity = 12;
      },
      {
        id = "10";
        name = "Chocolate Chips";
        description = "200g semi-sweet chocolate chips";
        pricePaise = 9500;
        category = #decoratingTools;
        stockQuantity = 18;
      },
      {
        id = "11";
        name = "Silicone Baking Mat";
        description = "Non-stick silicone baking mat";
        pricePaise = 25000;
        category = #bakingEquipment;
        stockQuantity = 8;
      },
      {
        id = "12";
        name = "Vanilla Cake Mix";
        description = "500g easy-to-make vanilla cake mix";
        pricePaise = 13000;
        category = #cakeMixes;
        stockQuantity = 22;
      },
    ];

    for (product in seedData.values()) {
      products.add(product.id, product);
    };
  };

  // Admin: Add product
  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    products.add(product.id, product);
  };

  // Admin: Update product
  public shared ({ caller }) func updateProduct(productId : Text, product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?_) {
        products.add(productId, product);
      };
    };
  };

  // Admin: Delete product
  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(productId);
  };

  // Public: Browse products
  public query func getProducts() : async [Product] {
    products.values().toArray();
  };

  // Public: Get products by category
  public query func getProductsByCategory(category : ProductCategory) : async [Product] {
    products.values().toArray().filter(
      func(p) { p.category == category }
    );
  };

  // Public: Validate pincode
  public query func isValidPincode(pincode : Text) : async Bool {
    validPincodes.find(func(p) { p == pincode }) != null;
  };

  // User: Get cart
  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };
    switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart };
    };
  };

  // User: Add to cart
  public shared ({ caller }) func addToCart(productId : Text, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add to cart");
    };

    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?product) {
        if (product.stockQuantity < quantity) {
          Runtime.trap("Not enough stock available");
        };

        let existingCart = switch (carts.get(caller)) {
          case (null) { [] };
          case (?cart) { cart };
        };

        let updatedCart = existingCart.map(
          func(item) {
            if (item.productId == productId) {
              { productId; quantity };
            } else {
              item;
            };
          }
        );

        let hasChanged = existingCart.find(
          func(item) { item.productId == productId }
        ) == null;

        if (hasChanged) {
          carts.add(caller, existingCart.concat([{ productId; quantity }]));
        } else {
          carts.add(caller, updatedCart);
        };
      };
    };
  };

  // User: Remove from cart
  public shared ({ caller }) func removeFromCart(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove from cart");
    };

    let existingCart = switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart };
    };

    let updatedCart = existingCart.filter(
      func(item) { item.productId != productId }
    );

    carts.add(caller, updatedCart);
  };

  // User: Clear cart
  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear cart");
    };
    carts.add(caller, []);
  };

  // User: Place order
  public shared ({ caller }) func placeOrder(deliveryAddress : DeliveryAddress, deliveryOption : DeliveryOption, paymentIntentId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    let cart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?cart) { cart };
    };

    if (cart.isEmpty()) {
      Runtime.trap("Cart is empty");
    };

    var totalAmount = 0;
    let orderItems = cart.map(
      func(item) {
        switch (products.get(item.productId)) {
          case (null) { Runtime.trap("Product does not exist") };
          case (?product) {
            if (product.stockQuantity < item.quantity) {
              Runtime.trap("Not enough stock for product: " # product.name);
            };
            totalAmount += product.pricePaise * item.quantity;
            {
              productId = product.id;
              name = product.name;
              pricePaise = product.pricePaise;
              quantity = item.quantity;
            };
          };
        };
      }
    );

    let orderId = "O" # nextOrderId.toText();
    nextOrderId += 1;

    let newOrder : Order = {
      id = orderId;
      userId = caller;
      items = orderItems;
      totalAmountPaise = totalAmount;
      deliveryAddress;
      deliveryOption;
      status = #pending;
      createdAt = Time.now();
      paymentIntentId;
    };

    orders.add(orderId, newOrder);

    // Deduct stock
    for (item in cart.values()) {
      switch (products.get(item.productId)) {
        case (null) {};
        case (?product) {
          let updatedProduct : Product = {
            id = product.id;
            name = product.name;
            description = product.description;
            pricePaise = product.pricePaise;
            category = product.category;
            stockQuantity = product.stockQuantity - item.quantity;
          };
          products.add(product.id, updatedProduct);
        };
      };
    };

    // Clear cart
    carts.remove(caller);

    orderId;
  };

  // User: Get own order
  public query ({ caller }) func getOrder(orderId : Text) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order does not exist") };
      case (?order) {
        if (order.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: This order does not belong to this user");
        };
        order;
      };
    };
  };

  // User: Get own orders
  public query ({ caller }) func getUserOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    orders.values().toArray().filter(
      func(o) { o.userId == caller }
    );
  };

  // Admin: Get all orders
  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  // Admin: Update order status
  public shared ({ caller }) func updateOrderStatus(orderId : Text, newStatus : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order does not exist") };
      case (?order) {
        let updatedOrder : Order = {
          id = order.id;
          userId = order.userId;
          items = order.items;
          totalAmountPaise = order.totalAmountPaise;
          deliveryAddress = order.deliveryAddress;
          deliveryOption = order.deliveryOption;
          status = newStatus;
          createdAt = order.createdAt;
          paymentIntentId = order.paymentIntentId;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  // Public: Filter products
  public query func filterProducts(category : ?ProductCategory, searchText : ?Text, minPrice : ?Nat, maxPrice : ?Nat) : async [Product] {
    let filteredProducts = products.values().toArray().filter(
      func(product) {
        let categoryMatch = switch (category) {
          case (?cat) { product.category == cat };
          case (null) { true };
        };
        let nameMatch = switch (searchText) {
          case (?text) { product.name.toLower().contains(#text(text.toLower())) };
          case (null) { true };
        };
        let inPriceRange = switch (minPrice, maxPrice) {
          case (null, null) { true };
          case (?min, null) { product.pricePaise >= min };
          case (null, ?max) { product.pricePaise <= max };
          case (?min, ?max) {
            product.pricePaise >= min and product.pricePaise <= max
          };
        };

        categoryMatch and nameMatch and inPriceRange
      }
    );
    filteredProducts;
  };
};
