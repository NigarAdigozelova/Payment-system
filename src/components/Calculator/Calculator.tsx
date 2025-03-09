import React, { useState } from "react";
import "./calculator.scss";
import axios from "axios";

interface Results {
  cartValueOutput: string;
  smallOrderSurchargeOutput: string;
  deliveryFeeOutput: string;
  deliveryDistanceOutput: string;
  totalPriceOutput: string;
  cartValueRaw: number;
  smallOrderSurchargeRaw: number;
  deliveryFeeRaw: number | null;
  deliveryDistanceRaw: number;
  totalPriceRaw: number;
}

const Calculator: React.FC = () => {
  const [venueSlug, setVenueSlug] = useState<string>("");
  const [cartValue, setCartValue] = useState<string>("");
  const [userLatitude, setUserLatitude] = useState<string>("");
  const [userLongitude, setUserLongitude] = useState<string>("");
  const [results, setResults] = useState<Results>({
    cartValueOutput: "-",
    smallOrderSurchargeOutput: "-",
    deliveryFeeOutput: "-",
    deliveryDistanceOutput: "-",
    totalPriceOutput: "-",
    cartValueRaw: 0,
    smallOrderSurchargeRaw: 0,
    deliveryFeeRaw: null,
    deliveryDistanceRaw: 0,
    totalPriceRaw: 0,
  });
  const [error, setError] = useState<string>("");

  //  I used Geolocation getCurrentPosition() Method.
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLatitude(position.coords.latitude.toFixed(5));
        setUserLongitude(position.coords.longitude.toFixed(5));
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };
  // Simple formula ---------------------------------------------------------------------------------------------------------
  // const calculateDistance = (
  //   lat1: number,
  //   lon1: number,
  //   lat2: number,
  //   lon2: number
  // ) => {
  //   const distance = Math.sqrt(
  //     Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)
  //   );
  //   return distance * 111000; // Convert degrees to meters (approximation) 
  // };

  // Haversine formula ------------------------------------------------------------------------------------------------------
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (value: number): number => (value * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};

  const handleCalculate = async () => {
    setError("");

    if (!venueSlug || !cartValue || !userLatitude || !userLongitude) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const staticResponse = await axios.get(
        `https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues/${venueSlug}/static`
      );
      const dynamicResponse = await axios.get(
        `https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues/${venueSlug}/dynamic`
      );

      const venueCoordinates: [number, number] =
        staticResponse.data.venue_raw.location.coordinates;

      const deliverySpecs = dynamicResponse.data.venue_raw.delivery_specs;

      const deliveryDistance = calculateDistance(
        parseFloat(userLatitude),
        parseFloat(userLongitude),
        venueCoordinates[1],
        venueCoordinates[0]
      );

      // const distanceRanges = deliverySpecs.delivery_pricing.distance_ranges;

      // const maxDistance = distanceRanges[distanceRanges.length - 1].min;

      // if (deliveryDistance > maxDistance) {
      //     setError('Delivery is not possible for this distance. The distance exceeds the maximum limit.');
      //     return;
      // } 
      // I tried, but something went wrong

      const cartValueCents = parseFloat(cartValue) * 100;

      const smallOrderSurcharge = Math.max(
        deliverySpecs.order_minimum_no_surcharge - cartValueCents,
        0
      );

      const basePrice = deliverySpecs.delivery_pricing.base_price;

      const deliveryFee = basePrice + Math.round(deliveryDistance / 100);

      // Total price
      const totalPrice = cartValueCents + smallOrderSurcharge + deliveryFee;

      setResults({
        cartValueOutput: `${(cartValueCents / 100).toFixed(2)} EUR`,
        smallOrderSurchargeOutput: `${(smallOrderSurcharge / 100).toFixed(
          2
        )} EUR`,
        deliveryFeeOutput: `${(deliveryFee / 100).toFixed(2)} EUR`,
        deliveryDistanceOutput: `${Math.round(deliveryDistance)} m`,
        totalPriceOutput: `${(totalPrice / 100).toFixed(2)} EUR`,
        cartValueRaw: cartValueCents,
        smallOrderSurchargeRaw: smallOrderSurcharge,
        deliveryFeeRaw: deliveryFee,
        deliveryDistanceRaw: Math.round(deliveryDistance),
        totalPriceRaw: totalPrice,
      });
    } catch (err) {
      setError("Failed to fetch venue data. Please check the venue slug.");
    }
  };
  return (
    <div className="container" id="app">
      <h1 className="title">Delivery Order Price Calculator</h1>

      <div className="input-group">
        <label htmlFor="venueSlug">Venue Slug:</label>
        <input
          type="text"
          id="venueSlug"
          data-test-id="venueSlug"
          value={venueSlug}
          onChange={(e) => setVenueSlug(e.target.value)}
          placeholder="home-assignment-venue-tallinn"
        />
      </div>
      <div className="input-group">
        <label htmlFor="cartValue">Cart Value (EUR):</label>
        <input
          type="number"
          id="cartValue"
          data-test-id="cartValue"
          value={cartValue}
          onChange={(e) => setCartValue(e.target.value)}
          placeholder="Enter cart value"
        />
      </div>
      <div className="input-group">
        <label htmlFor="userLatitude">User Latitude:</label>
        <input
          type="number"
          id="userLatitude"
          data-test-id="userLatitude"
          value={userLatitude}
          onChange={(e) => setUserLatitude(e.target.value)}
          placeholder="Enter user latitude"
        />
      </div>
      <div className="input-group">
        <label htmlFor="userLongitude">User Longitude:</label>
        <input
          type="number"
          id="userLongitude"
          data-test-id="userLongitude"
          value={userLongitude}
          onChange={(e) => setUserLongitude(e.target.value)}
          placeholder="Enter user longitude"
        />
      </div>

      <button className="button" onClick={handleGetLocation}>
        Get Location
      </button>
      <button className="button" onClick={handleCalculate}>
        Calculate
      </button>

      {error && <p className="error">{error}</p>}

      <div className="results">
        <h2>Results:</h2>
        <p>
          Cart Value:{" "}
          <span data-raw-value="{results.cartValueRaw}">
            {results.cartValueOutput}
          </span>
        </p>
        <p>
          Small Order Surcharge:{" "}
          <span data-raw-value="{results.smallOrderSurchargeRaw}">
            {results.smallOrderSurchargeOutput}
          </span>
        </p>
        <p>
          Delivery Fee:{" "}
          <span data-raw-value="{results.deliveryFeeRaw ?? 'N/A'}">
            {results.deliveryFeeOutput}
          </span>
        </p>
        <p>
          Delivery Distance:{" "}
          <span data-raw-value="{results.deliveryDistanceRaw}">
            {results.deliveryDistanceOutput}
          </span>
        </p>
        <p>
          Total Price:{" "}
          <span data-raw-value="{results.totalPriceRaw}">
            {results.totalPriceOutput}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Calculator;
