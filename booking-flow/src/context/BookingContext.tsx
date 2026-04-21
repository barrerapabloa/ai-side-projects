"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Flight,
  PassengerDraft,
  SearchState,
  TripType,
} from "@/types/booking";
import { buildSeatsForFlight, seatMapFromList } from "@/lib/seats";

const STORAGE_KEY = "spacexBookingFlow";

export type BookingSnapshot = {
  search: SearchState | null;
  selectedFlight: Flight | null;
  selectedSeatIds: string[];
  passengers: PassengerDraft[];
  reviewAccepted: boolean;
  paidAt: string | null;
  confirmationCode: string | null;
};

function emptySnapshot(): BookingSnapshot {
  return {
    search: null,
    selectedFlight: null,
    selectedSeatIds: [],
    passengers: [],
    reviewAccepted: false,
    paidAt: null,
    confirmationCode: null,
  };
}

function normalizeSearch(raw: unknown): SearchState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<SearchState>;
  if (
    !o.origin ||
    !o.destination ||
    !o.departDate ||
    typeof o.passengers !== "number"
  ) {
    return null;
  }
  const tripType: TripType =
    o.tripType === "round-trip" ? "round-trip" : "one-way";
  return {
    origin: o.origin,
    destination: o.destination,
    departDate: o.departDate,
    passengers: o.passengers,
    tripType,
    returnDate:
      tripType === "round-trip" && o.returnDate ? o.returnDate : null,
  };
}

function loadSnapshot(): BookingSnapshot {
  if (typeof window === "undefined") return emptySnapshot();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySnapshot();
    const parsed = JSON.parse(raw) as Partial<BookingSnapshot>;
    const merged: BookingSnapshot = { ...emptySnapshot(), ...parsed };
    merged.search =
      parsed.search !== undefined ? normalizeSearch(parsed.search) : null;
    return merged;
  } catch {
    return emptySnapshot();
  }
}

type BookingContextValue = BookingSnapshot & {
  setSearch: (s: SearchState | null) => void;
  setSelectedFlight: (f: Flight | null) => void;
  toggleSeat: (seatId: string) => void;
  setPassengers: (p: PassengerDraft[]) => void;
  setReviewAccepted: (v: boolean) => void;
  completePayment: () => string;
  resetFlow: () => void;
  seatByFlightId: Record<string, ReturnType<typeof seatMapFromList>>;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<BookingSnapshot>(() => {
    if (typeof window === "undefined") return emptySnapshot();
    return loadSnapshot();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  }, [snap]);

  const setSearch = useCallback((search: SearchState | null) => {
    setSnap((prev) => ({
      ...prev,
      search,
      selectedFlight: null,
      selectedSeatIds: [],
      passengers: [],
      reviewAccepted: false,
      paidAt: null,
      confirmationCode: null,
    }));
  }, []);

  const setSelectedFlight = useCallback((selectedFlight: Flight | null) => {
    setSnap((prev) => ({
      ...prev,
      selectedFlight,
      selectedSeatIds: [],
      passengers: [],
      reviewAccepted: false,
      paidAt: null,
      confirmationCode: null,
    }));
  }, []);

  const toggleSeat = useCallback(
    (seatId: string) => {
      setSnap((prev) => {
        const max =
          prev.search?.passengers ??
          Math.max(1, prev.passengers.length || 1);
        const flightId = prev.selectedFlight?.id;
        if (!flightId) return prev;

        const seats = buildSeatsForFlight(flightId);
        const map = seatMapFromList(seats);
        const seat = map[seatId];
        if (!seat || seat.state !== "available") return prev;

        const next = new Set(prev.selectedSeatIds);
        if (next.has(seatId)) {
          next.delete(seatId);
        } else if (next.size < max) {
          next.add(seatId);
        } else if (max === 1) {
          next.clear();
          next.add(seatId);
        }
        const sorted = [...next].sort((a, b) => {
          const ra = parseInt(a, 10);
          const rb = parseInt(b, 10);
          if (ra !== rb) return ra - rb;
          return a.localeCompare(b);
        });

        return {
          ...prev,
          selectedSeatIds: sorted,
          passengers: sorted.map((_, i) => prev.passengers[i] ?? emptyPassenger()),
        };
      });
    },
    [],
  );

  const setPassengers = useCallback((passengers: PassengerDraft[]) => {
    setSnap((prev) => ({ ...prev, passengers }));
  }, []);

  const setReviewAccepted = useCallback((reviewAccepted: boolean) => {
    setSnap((prev) => ({ ...prev, reviewAccepted }));
  }, []);

  const completePayment = useCallback(() => {
    const code =
      `SX${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
    const paidAt = new Date().toISOString();
    setSnap((prev) => ({
      ...prev,
      paidAt,
      confirmationCode: code,
    }));
    return code;
  }, []);

  const resetFlow = useCallback(() => {
    setSnap(emptySnapshot());
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const seatByFlightId = useMemo(() => {
    const fid = snap.selectedFlight?.id;
    if (!fid) return {};
    return { [fid]: seatMapFromList(buildSeatsForFlight(fid)) };
  }, [snap.selectedFlight?.id]);

  const value = useMemo<BookingContextValue>(
    () => ({
      ...snap,
      setSearch,
      setSelectedFlight,
      toggleSeat,
      setPassengers,
      setReviewAccepted,
      completePayment,
      resetFlow,
      seatByFlightId,
    }),
    [
      snap,
      setSearch,
      setSelectedFlight,
      toggleSeat,
      setPassengers,
      setReviewAccepted,
      completePayment,
      resetFlow,
      seatByFlightId,
    ],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

function emptyPassenger(): PassengerDraft {
  return {
    givenName: "",
    familyName: "",
    email: "",
    dateOfBirth: "",
  };
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
