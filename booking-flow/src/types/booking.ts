export type TripType = "one-way" | "round-trip";

export type SearchState = {
  origin: string;
  destination: string;
  departDate: string;
  passengers: number;
  tripType: TripType;
  /** Set when `tripType === "round-trip"` (YYYY-MM-DD). */
  returnDate: string | null;
};

export type CabinTier = "economy" | "business" | "first";

export type Flight = {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departLabel: string;
  arriveLabel: string;
  durationLabel: string;
  priceUsd: number;
  /** e.g. "Nonstop" */
  stopsLabel: string;
  /** Older saved sessions may omit — treat as economy when missing */
  cabinTier?: CabinTier;
  /** Cabin / fare family for reassurance copy */
  fareLabel: string;
  aircraftType: string;
  baggageIncluded: string;
  /** Human note for arrival calendar day vs departure */
  arriveDaySummary: string;
};

export type PassengerDraft = {
  givenName: string;
  familyName: string;
  email: string;
  dateOfBirth: string;
  passportNumber: string;
  passportCountry: string;
  passportExpiry: string;
};

export type SeatCategory = "standard" | "premium" | "extraLegroom";
export type SeatState = "available" | "occupied" | "restricted";
export type SeatType = "window" | "aisle" | "middle";

export type Seat = {
  id: string;
  row: number;
  letter: string;
  type: SeatType;
  category: SeatCategory;
  state: SeatState;
  price: number | null;
};
