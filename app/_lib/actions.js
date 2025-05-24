"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";
import { supabase } from "./supabase";
import { getBookings } from "./data-service";
import { redirect } from "next/navigation";

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }
  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");
  const regex = /^[a-zA-Z0-9]{6,12}$/;
  if (!regex.test(nationalID)) {
    throw new Error("Please provide a valid National ID");
  }

  const updateData = {
    nationality,
    nationalID,
    countryFlag,
  };

  const { error } = await supabase
    .from("guests")
    .update(updateData)
    .eq("id", session.user.guestId);

  if (error) {
    throw new Error("Guest could not be updated");
  }

  revalidatePath("/account/profile");
}

export async function deleteReservation(bookingId) {
  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((b) => b.id);
  if (!guestBookingsIds.includes(bookingId)) {
    throw new Error("You are not allowed to delete this booking");
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    throw new Error("Booking could not be deleted");
  }

  revalidatePath("/account/reservations");
}

export async function updateReservation(formData) {
  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }

  const observations = formData.get("observations");
  const numGuests = Number(formData.get("numGuests"));
  const reservationId = formData.get("reservationId");

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((b) => b.id);
  if (!guestBookingsIds.includes(Number(reservationId))) {
    throw new Error("You are not allowed to update this booking");
  }

  const updatedData = {
    observations,
    numGuests,
  };

  const { error } = await supabase
    .from("bookings")
    .update(updatedData)
    .eq("id", reservationId);

  if (error) {
    throw new Error("Booking could not be updated");
  }
  revalidatePath("/account/reservations");
  revalidatePath(`/account/reservations/edit/${reservationId}`);
  redirect("/account/reservations");
}
