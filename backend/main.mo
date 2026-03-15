import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";

actor {
  type EventType = {
    #Flight;
    #Hotel;
    #Activity;
  };

  type Location = {
    name : Text;
    address : ?Text;
  };

  type Event = {
    id : Nat;
    tripId : Nat;
    eventType : EventType;
    title : Text;
    dateTime : Int;
    location : Location;
    confirmationCode : ?Text;
    notes : ?Text;
    createdAt : Int;
  };

  type Trip = {
    id : Nat;
    name : Text;
    destination : ?Text;
    startDate : ?Int;
    endDate : ?Int;
    shareToken : Text;
    createdAt : Int;
  };

  type TripWithEvents = {
    trip : Trip;
    events : [Event];
  };

  type ShareTokenEntry = {
    owner : Principal;
    tripId : Nat;
  };

  type Profile = {
    name : Text;
  };

  var nextId : Nat = 1;
  var userTrips : Map.Map<Principal, Map.Map<Nat, Trip>> = Map.empty();
  var userEvents : Map.Map<Principal, Map.Map<Nat, Event>> = Map.empty();
  var shareTokenIndex : Map.Map<Text, ShareTokenEntry> = Map.empty();
  var userProfiles : Map.Map<Principal, Profile> = Map.empty();

  // Limits
  let MAX_TRIPS_PER_USER : Nat = 50;
  let MAX_EVENTS_PER_TRIP : Nat = 100;

  // Field length limits
  let MAX_TRIP_NAME_LENGTH : Nat = 100;
  let MAX_DESTINATION_LENGTH : Nat = 200;
  let MAX_EVENT_TITLE_LENGTH : Nat = 200;
  let MAX_LOCATION_NAME_LENGTH : Nat = 300;
  let MAX_CONFIRMATION_CODE_LENGTH : Nat = 50;
  let MAX_NOTES_LENGTH : Nat = 2000;

  // Helper functions
  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func genId() : Nat {
    let id = nextId;
    nextId += 1;
    id;
  };

  func getMap<V>(store : Map.Map<Principal, Map.Map<Nat, V>>, user : Principal) : Map.Map<Nat, V> {
    switch (store.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, V>();
        store.add(user, m);
        m;
      };
    };
  };

  func trips(u : Principal) : Map.Map<Nat, Trip> { getMap(userTrips, u) };
  func events(u : Principal) : Map.Map<Nat, Event> { getMap(userEvents, u) };

  func countEventsForTrip(caller : Principal, tripId : Nat) : Nat {
    events(caller).values().toArray().filter(func(e) { e.tripId == tripId }).size();
  };

  func validateFieldLength(value : Text, fieldName : Text, minLen : Nat, maxLen : Nat) {
    if (value.size() < minLen) {
      Runtime.trap(fieldName # " cannot be empty");
    };
    if (value.size() > maxLen) {
      Runtime.trap(fieldName # " too long (max " # maxLen.toText() # " characters)");
    };
  };

  func validateOptionalFieldLength(value : ?Text, fieldName : Text, maxLen : Nat) {
    switch (value) {
      case (?v) {
        if (v.size() > maxLen) {
          Runtime.trap(fieldName # " too long (max " # maxLen.toText() # " characters)");
        };
      };
      case (null) {};
    };
  };

  func generateShareToken(id : Nat) : Text {
    id.toText() # "-" # Time.now().toText();
  };

  func getEventsForTrip(caller : Principal, tripId : Nat) : [Event] {
    let tripEvents = events(caller).values().toArray().filter(
      func(e) { e.tripId == tripId }
    );
    tripEvents.sort(
      func(a, b) { Int.compare(a.dateTime, b.dateTime) }
    );
  };

  func deleteEventsForTrip(caller : Principal, tripId : Nat) {
    for ((id, e) in events(caller).entries().toArray().vals()) {
      if (e.tripId == tripId) {
        events(caller).remove(id);
      };
    };
  };

  public shared ({ caller }) func createTrip(name : Text, destination : ?Text, startDate : ?Int, endDate : ?Int) : async Nat {
    requireAuth(caller);
    if (trips(caller).size() >= MAX_TRIPS_PER_USER) {
      Runtime.trap("Maximum of " # MAX_TRIPS_PER_USER.toText() # " trips reached");
    };
    validateFieldLength(name, "Name", 1, MAX_TRIP_NAME_LENGTH);
    validateOptionalFieldLength(destination, "Destination", MAX_DESTINATION_LENGTH);

    // If startDate is provided, endDate is required and must be >= startDate
    switch (startDate, endDate) {
      case (?start, ?end) {
        if (end < start) {
          Runtime.trap("End date must be after start date");
        };
      };
      case (?_, null) {
        Runtime.trap("End date is required when start date is set");
      };
      case (null, ?_) {
        Runtime.trap("Start date is required when end date is set");
      };
      case (null, null) {};
    };

    let id = genId();
    let shareToken = generateShareToken(id);

    trips(caller).add(
      id,
      {
        id;
        name;
        destination;
        startDate;
        endDate;
        shareToken;
        createdAt = Time.now();
      },
    );

    shareTokenIndex.add(shareToken, { owner = caller; tripId = id });
    id;
  };

  public query ({ caller }) func getTrips() : async [Trip] {
    requireAuth(caller);
    trips(caller).values().toArray();
  };

  public query ({ caller }) func getTripById(id : Nat) : async ?TripWithEvents {
    requireAuth(caller);
    switch (trips(caller).get(id)) {
      case (null) { null };
      case (?trip) { ?{ trip; events = getEventsForTrip(caller, id) } };
    };
  };

  public shared ({ caller }) func updateTrip(id : Nat, name : Text, destination : ?Text, startDate : ?Int, endDate : ?Int) : async () {
    requireAuth(caller);
    validateFieldLength(name, "Name", 1, MAX_TRIP_NAME_LENGTH);
    validateOptionalFieldLength(destination, "Destination", MAX_DESTINATION_LENGTH);

    // If startDate is provided, endDate is required and must be >= startDate
    switch (startDate, endDate) {
      case (?start, ?end) {
        if (end < start) {
          Runtime.trap("End date must be after start date");
        };
      };
      case (?_, null) {
        Runtime.trap("End date is required when start date is set");
      };
      case (null, ?_) {
        Runtime.trap("Start date is required when end date is set");
      };
      case (null, null) {};
    };

    switch (trips(caller).get(id)) {
      case (null) {
        Runtime.trap("Trip not found");
      };
      case (?t) {
        trips(caller).add(id, { t with name; destination; startDate; endDate });
      };
    };
  };

  public shared ({ caller }) func deleteTrip(id : Nat) : async () {
    requireAuth(caller);
    switch (trips(caller).get(id)) {
      case (null) {
        Runtime.trap("Trip not found");
      };
      case (?t) {
        deleteEventsForTrip(caller, id);
        shareTokenIndex.remove(t.shareToken);
        trips(caller).remove(id);
      };
    };
  };

  public shared ({ caller }) func createEvent(
    tripId : Nat,
    eventType : EventType,
    title : Text,
    dateTime : Int,
    location : Location,
    confirmationCode : ?Text,
    notes : ?Text,
  ) : async Nat {
    requireAuth(caller);
    if (trips(caller).get(tripId) == null) {
      Runtime.trap("Trip not found");
    };
    if (countEventsForTrip(caller, tripId) >= MAX_EVENTS_PER_TRIP) {
      Runtime.trap("Maximum of " # MAX_EVENTS_PER_TRIP.toText() # " events per trip reached");
    };

    validateFieldLength(title, "Title", 1, MAX_EVENT_TITLE_LENGTH);
    validateFieldLength(location.name, "Location name", 1, MAX_LOCATION_NAME_LENGTH);
    validateOptionalFieldLength(confirmationCode, "Confirmation code", MAX_CONFIRMATION_CODE_LENGTH);
    validateOptionalFieldLength(notes, "Notes", MAX_NOTES_LENGTH);

    let id = genId();
    events(caller).add(
      id,
      {
        id;
        tripId;
        eventType;
        title;
        dateTime;
        location;
        confirmationCode;
        notes;
        createdAt = Time.now();
      },
    );
    id;
  };

  public query ({ caller }) func getEvents(tripId : Nat) : async [Event] {
    requireAuth(caller);
    if (trips(caller).get(tripId) == null) {
      Runtime.trap("Trip not found");
    };
    getEventsForTrip(caller, tripId);
  };

  public shared ({ caller }) func updateEvent(
    id : Nat,
    eventType : EventType,
    title : Text,
    dateTime : Int,
    location : Location,
    confirmationCode : ?Text,
    notes : ?Text,
  ) : async () {
    requireAuth(caller);
    validateFieldLength(title, "Title", 1, MAX_EVENT_TITLE_LENGTH);
    validateFieldLength(location.name, "Location name", 1, MAX_LOCATION_NAME_LENGTH);
    validateOptionalFieldLength(confirmationCode, "Confirmation code", MAX_CONFIRMATION_CODE_LENGTH);
    validateOptionalFieldLength(notes, "Notes", MAX_NOTES_LENGTH);

    switch (events(caller).get(id)) {
      case (null) {
        Runtime.trap("Event not found");
      };
      case (?e) {
        events(caller).add(id, { e with eventType; title; dateTime; location; confirmationCode; notes });
      };
    };
  };

  public shared ({ caller }) func deleteEvent(id : Nat) : async () {
    requireAuth(caller);
    switch (events(caller).get(id)) {
      case (null) {
        Runtime.trap("Event not found");
      };
      case (?_) {
        events(caller).remove(id);
      };
    };
  };

  public query func getSharedTrip(shareToken : Text) : async ?TripWithEvents {
    switch (shareTokenIndex.get(shareToken)) {
      case (null) { null };
      case (?entry) {
        switch (trips(entry.owner).get(entry.tripId)) {
          case (null) { null };
          case (?trip) {
            ?{ trip; events = getEventsForTrip(entry.owner, entry.tripId) };
          };
        };
      };
    };
  };

  public query ({ caller }) func getProfile() : async ?Profile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public shared ({ caller }) func setProfile(name : Text) : async () {
    requireAuth(caller);
    validateFieldLength(name, "Name", 1, MAX_TRIP_NAME_LENGTH);
    userProfiles.add(caller, { name });
  };
};
