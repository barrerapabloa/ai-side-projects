import BookingShell from "./booking-shell";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BookingShell>{children}</BookingShell>;
}
