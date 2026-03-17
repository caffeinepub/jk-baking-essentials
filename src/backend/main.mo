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

  // Stripe configuration
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Legacy stable vars kept for upgrade migration compatibility
  var adminEmail : Text = "kishooore1@gmail.com";
  var adminPassword : ?Text = null;

  // Admin PIN (set on first login)
  var adminPin : ?Text = null;

  // Track principals that have verified PIN this session
  let adminVerifiedPrincipals = Map.empty<Principal, Bool>();

  // Check if caller is PIN-verified admin
  func isPinAdmin(caller : Principal) : Bool {
    switch (adminVerifiedPrincipals.get(caller)) {
      case (?true) { true };
      case (_) { false };
    };
  };

  // Check if caller is admin (PIN-verified OR AccessControl admin)
  func isAdminCaller(caller : Principal) : Bool {
    isPinAdmin(caller) or AccessControl.isAdmin(accessControlState, caller);
  };

  // First-time: set PIN. Subsequent calls are ignored (use resetAdminPin to change).
  public shared func setAdminPin(pin : Text) : async Bool {
    switch (adminPin) {
      case (null) {
        adminPin := ?pin;
        true;
      };
      case (?_) {
        false; // Already set
      };
    };
  };

  public query func isAdminPinSet() : async Bool {
    adminPin != null;
  };

  // Login with PIN — marks this principal as admin for the session
  public shared ({ caller }) func adminPinLogin(pin : Text) : async Bool {
    switch (adminPin) {
      case (null) { false };
      case (?stored) {
        if (stored == pin) {
          adminVerifiedPrincipals.add(caller, true);
          true;
        } else {
          false;
        };
      };
    };
  };

  // Reset PIN using old PIN for verification
  public shared ({ caller }) func resetAdminPin(oldPin : Text, newPin : Text) : async Bool {
    switch (adminPin) {
      case (null) { false };
      case (?stored) {
        if (stored == oldPin) {
          adminPin := ?newPin;
          true;
        } else {
          false;
        };
      };
    };
  };

  // Force-reset PIN (only if AccessControl admin or no pin set)
  public shared ({ caller }) func forceResetAdminPin() : async Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      adminPin := null;
      true;
    } else {
      false;
    };
  };

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
    if (not isAdminCaller(caller)) {
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

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdminCaller(caller)) {
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

  public shared ({ caller }) func seedProducts() : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can seed products");
    };

    let seedData : [Product] = [
      { id = "1"; name = "All Purpose Flour (Maida)"; description = "1kg pack of premium all purpose flour"; pricePaise = 8000; category = #floursGrains; stockQuantity = 50 },
      { id = "2"; name = "Whole Wheat Flour"; description = "1kg pack of whole wheat flour"; pricePaise = 9500; category = #floursGrains; stockQuantity = 40 },
      { id = "3"; name = "Organic Brown Sugar"; description = "500g organic brown sugar"; pricePaise = 7500; category = #sweeteners; stockQuantity = 30 },
      { id = "4"; name = "Cocoa Powder"; description = "250g premium cocoa powder"; pricePaise = 12000; category = #flavorExtracts; stockQuantity = 20 },
      { id = "5"; name = "Vanilla Extract"; description = "60ml pure vanilla extract"; pricePaise = 18000; category = #flavorExtracts; stockQuantity = 15 },
      { id = "6"; name = "Baking Powder"; description = "100g baking powder"; pricePaise = 4000; category = #leaveningAgents; stockQuantity = 25 },
      { id = "7"; name = "Active Dry Yeast"; description = "100g active dry yeast"; pricePaise = 6000; category = #leaveningAgents; stockQuantity = 20 },
      { id = "8"; name = "Unsalted Butter"; description = "500g unsalted butter"; pricePaise = 32000; category = #fatsOils; stockQuantity = 10 },
      { id = "9"; name = "Sunflower Oil"; description = "1 litre cold pressed sunflower oil"; pricePaise = 14000; category = #fatsOils; stockQuantity = 12 },
      { id = "10"; name = "Chocolate Chips"; description = "200g semi-sweet chocolate chips"; pricePaise = 9500; category = #decoratingTools; stockQuantity = 18 },
      { id = "11"; name = "Silicone Baking Mat"; description = "Non-stick silicone baking mat"; pricePaise = 25000; category = #bakingEquipment; stockQuantity = 8 },
      { id = "12"; name = "Vanilla Cake Mix"; description = "500g easy-to-make vanilla cake mix"; pricePaise = 13000; category = #cakeMixes; stockQuantity = 22 },
    ];

    for (product in seedData.values()) {
      products.add(product.id, product);
    };
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(productId : Text, product : Product) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?_) { products.add(productId, product) };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(productId);
  };

  public query func getProducts() : async [Product] {
    products.values().toArray();
  };

  public query func getProductsByCategory(category : ProductCategory) : async [Product] {
    products.values().toArray().filter(func(p) { p.category == category });
  };

  public query func isValidPincode(pincode : Text) : async Bool {
    validPincodes.find(func(p) { p == pincode }) != null;
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };
    switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart };
    };
  };

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
        let updatedCart = existingCart.map(func(item) {
          if (item.productId == productId) { { productId; quantity } } else { item };
        });
        let hasChanged = existingCart.find(func(item) { item.productId == productId }) == null;
        if (hasChanged) {
          carts.add(caller, existingCart.concat([{ productId; quantity }]));
        } else {
          carts.add(caller, updatedCart);
        };
      };
    };
  };

  public shared ({ caller }) func removeFromCart(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove from cart");
    };
    let existingCart = switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart };
    };
    carts.add(caller, existingCart.filter(func(item) { item.productId != productId }));
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear cart");
    };
    carts.add(caller, []);
  };

  public shared ({ caller }) func placeOrder(deliveryAddress : DeliveryAddress, deliveryOption : DeliveryOption, paymentIntentId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    let cart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?cart) { cart };
    };
    if (cart.isEmpty()) { Runtime.trap("Cart is empty") };

    var totalAmount = 0;
    let orderItems = cart.map(func(item) {
      switch (products.get(item.productId)) {
        case (null) { Runtime.trap("Product does not exist") };
        case (?product) {
          if (product.stockQuantity < item.quantity) {
            Runtime.trap("Not enough stock for product: " # product.name);
          };
          totalAmount += product.pricePaise * item.quantity;
          { productId = product.id; name = product.name; pricePaise = product.pricePaise; quantity = item.quantity };
        };
      };
    });

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

    for (item in cart.values()) {
      switch (products.get(item.productId)) {
        case (null) {};
        case (?product) {
          products.add(product.id, {
            id = product.id;
            name = product.name;
            description = product.description;
            pricePaise = product.pricePaise;
            category = product.category;
            stockQuantity = product.stockQuantity - item.quantity;
          });
        };
      };
    };
    carts.remove(caller);
    orderId;
  };

  public query ({ caller }) func getOrder(orderId : Text) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order does not exist") };
      case (?order) {
        if (order.userId != caller and not isAdminCaller(caller)) {
          Runtime.trap("Unauthorized: This order does not belong to this user");
        };
        order;
      };
    };
  };

  public query ({ caller }) func getUserOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().toArray().filter(func(o) { o.userId == caller });
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, newStatus : OrderStatus) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order does not exist") };
      case (?order) {
        orders.add(orderId, {
          id = order.id;
          userId = order.userId;
          items = order.items;
          totalAmountPaise = order.totalAmountPaise;
          deliveryAddress = order.deliveryAddress;
          deliveryOption = order.deliveryOption;
          status = newStatus;
          createdAt = order.createdAt;
          paymentIntentId = order.paymentIntentId;
        });
      };
    };
  };

  public query func filterProducts(category : ?ProductCategory, searchText : ?Text, minPrice : ?Nat, maxPrice : ?Nat) : async [Product] {
    products.values().toArray().filter(func(product) {
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
        case (?min, ?max) { product.pricePaise >= min and product.pricePaise <= max };
      };
      categoryMatch and nameMatch and inPriceRange
    });
  };
};
