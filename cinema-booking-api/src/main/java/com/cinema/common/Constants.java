package com.cinema.common;

/**
 * Application-wide constants.
 */
public final class Constants {

    private Constants() {}

    // Roles
    public static final String ROLE_CUSTOMER = "CUSTOMER";
    public static final String ROLE_STAFF = "STAFF";
    public static final String ROLE_ADMIN = "ADMIN";

    // Booking
    public static final String REDIS_SEAT_HOLD_PREFIX = "seat:hold:";
    public static final String REDIS_BOOKING_PREFIX = "booking:";

    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    // Ticket code format
    public static final String TICKET_CODE_PREFIX = "TKT";
}
