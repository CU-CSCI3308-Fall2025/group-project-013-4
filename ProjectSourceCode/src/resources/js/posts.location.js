(function () {
  const state = {
    searchInput: null,
    suggestionsEl: null,
    locationNameInput: null,
    locationAddressInput: null,
    locationLatInput: null,
    locationLngInput: null,
    locationPlaceIdInput: null,
    suggestionsBound: false,
    googleReadyPromise: null,
    googleReady: false,
    autocompleteService: null,
    placesService: null,
    geocoder: null,
    sessionToken: null,
    locationBias: null,
    lastSelectionText: "",
  };

  function getEl(id) {
    return document.getElementById(id);
  }

  function clearHiddenFields() {
    if (state.locationNameInput) state.locationNameInput.value = "";
    if (state.locationAddressInput) state.locationAddressInput.value = "";
    if (state.locationLatInput) state.locationLatInput.value = "";
    if (state.locationLngInput) state.locationLngInput.value = "";
    if (state.locationPlaceIdInput) state.locationPlaceIdInput.value = "";
  }

  function hideSuggestions() {
    if (state.suggestionsEl) {
      state.suggestionsEl.classList.remove("show");
      state.suggestionsEl.innerHTML = "";
    }
  }

  function waitForGoogle() {
    if (state.googleReady) return Promise.resolve(true);
    if (!document.getElementById("googleMapsApiScript")) {
      return Promise.resolve(false);
    }
    if (!state.googleReadyPromise) {
      state.googleReadyPromise = new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
          if (window.google?.maps?.places) {
            state.googleReady = true;
            resolve(true);
            return;
          }
          if (Date.now() - start > 8000) {
            resolve(false);
            return;
          }
          requestAnimationFrame(check);
        };
        check();
      });
    }
    return state.googleReadyPromise;
  }

  async function ensureGoogleServices() {
    if (state.autocompleteService && state.placesService) return true;
    const ready = await waitForGoogle();
    if (!ready) return false;
    try {
      state.autocompleteService = new google.maps.places.AutocompleteService();
      state.placesService = new google.maps.places.PlacesService(document.createElement("div"));
      state.geocoder = new google.maps.Geocoder();
      state.sessionToken = new google.maps.places.AutocompleteSessionToken();
      return true;
    } catch (err) {
      console.warn("Unable to init Google Maps services", err);
      return false;
    }
  }

  async function fallbackReverseGeocode(latitude, longitude) {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", latitude);
    url.searchParams.set("lon", longitude);
    url.searchParams.set("zoom", "16");
    url.searchParams.set("addressdetails", "1");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Reverse geocode request failed with status ${response.status}`);
      }

      const data = await response.json();
      const displayName = data?.display_name || data?.name;
      if (!displayName) {
        return null;
      }

      return {
        name: data?.name || displayName,
        address: displayName,
        displayText: displayName,
      };
    } catch (error) {
      console.warn("Fallback reverse geocoding failed", error);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function buildSuggestionElement(item) {
    if (!state.suggestionsEl) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "location-suggestion";
    if (item.placeId) btn.dataset.placeId = item.placeId;
    if (item.lat) btn.dataset.lat = item.lat;
    if (item.lng) btn.dataset.lng = item.lng;
    if (item.address) btn.dataset.address = item.address;
    if (item.primaryText) btn.dataset.primary = item.primaryText;
    if (item.secondaryText) btn.dataset.secondary = item.secondaryText;

    const primary = document.createElement("div");
    primary.className = "location-suggestion-primary";
    primary.textContent = item.primaryText || item.secondaryText || "";
    btn.appendChild(primary);

    if (item.secondaryText) {
      const secondary = document.createElement("div");
      secondary.className = "location-suggestion-secondary";
      secondary.textContent = item.secondaryText;
      btn.appendChild(secondary);
    }

    return btn;
  }

  function renderSuggestions(items) {
    if (!state.suggestionsEl) return;
    state.suggestionsEl.innerHTML = "";

    if (!items?.length) {
      state.suggestionsEl.classList.remove("show");
      return;
    }

    items.forEach((item) => {
      const el = buildSuggestionElement(item);
      if (el) state.suggestionsEl.appendChild(el);
    });

    state.suggestionsEl.classList.add("show");
  }

  function applySelectedLocation(data = {}, options = {}) {
    const display = data.displayText || data.name || data.address || "";
    if (state.searchInput) state.searchInput.value = display;
    state.lastSelectionText = display;

    if (state.locationNameInput) state.locationNameInput.value = data.name || "";
    if (state.locationAddressInput) state.locationAddressInput.value = data.address || "";
    if (state.locationLatInput) state.locationLatInput.value = data.lat ?? "";
    if (state.locationLngInput) state.locationLngInput.value = data.lng ?? "";
    if (state.locationPlaceIdInput) state.locationPlaceIdInput.value = data.placeId || "";

    if (!options.keepSuggestions) {
      hideSuggestions();
    }
  }

  async function fetchPlaceDetails(placeId, fallbackText) {
    const ready = await ensureGoogleServices();
    if (!ready || !state.placesService) {
      applySelectedLocation({ name: fallbackText, displayText: fallbackText });
      return;
    }

    state.placesService.getDetails(
      {
        placeId,
        fields: ["place_id", "name", "formatted_address", "geometry", "vicinity"],
      },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          applySelectedLocation({ name: fallbackText, displayText: fallbackText });
          return;
        }

        const location = place.geometry?.location;
        applySelectedLocation({
          name: place.name || fallbackText,
          address: place.formatted_address || place.vicinity || "",
          lat: location ? location.lat() : "",
          lng: location ? location.lng() : "",
          placeId: place.place_id || placeId,
          displayText: place.name || place.formatted_address || fallbackText,
        });
      }
    );
  }

  async function handleSearchInput(event) {
    const value = event.target.value.trim();

    if (state.lastSelectionText && value !== state.lastSelectionText) {
      state.lastSelectionText = "";
      clearHiddenFields();
    }

    if (!value) {
      state.lastSelectionText = "";
      clearHiddenFields();
      hideSuggestions();
      return;
    }

    if (!(await ensureGoogleServices()) || !state.autocompleteService) {
      return;
    }

    const request = {
      input: value,
      sessionToken: state.sessionToken,
    };

    if (state.locationBias) {
      request.locationBias = state.locationBias;
    }

    state.autocompleteService.getPlacePredictions(
      request,
      (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions?.length) {
          renderSuggestions([]);
          return;
        }

        const items = predictions.slice(0, 6).map((prediction) => ({
          primaryText: prediction.structured_formatting?.main_text || prediction.description,
          secondaryText: prediction.structured_formatting?.secondary_text || "",
          placeId: prediction.place_id,
        }));
        renderSuggestions(items);
      }
    );
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert("Location services are not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const ready = await ensureGoogleServices();

        const applyFallbackOrCoords = async () => {
          const fallbackResult = await fallbackReverseGeocode(latitude, longitude);
          if (fallbackResult) {
            applySelectedLocation({
              ...fallbackResult,
              lat: latitude,
              lng: longitude,
            });
            return;
          }

          applySelectedLocation({
            name: `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`,
            lat: latitude,
            lng: longitude,
          });
        };

        if (ready && window.google?.maps) {
          state.locationBias = new google.maps.LatLng(latitude, longitude);
        }

        if (ready && state.placesService) {
          state.placesService.nearbySearch(
            {
              location: state.locationBias,
              radius: 2000,
              rankBy: google.maps.places.RankBy.PROMINENCE,
            },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results?.length) {
                const items = results.slice(0, 6).map((place) => ({
                  primaryText: place.name,
                  secondaryText: place.vicinity || place.formatted_address || "",
                  placeId: place.place_id,
                  lat: place.geometry?.location?.lat(),
                  lng: place.geometry?.location?.lng(),
                }));
                renderSuggestions(items);
                return;
              }
            }
          );
        }

        if (ready && state.geocoder) {
          state.geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            async (results, status) => {
              if (status === "OK" && results?.length) {
                applySelectedLocation({
                  name: results[0].formatted_address,
                  address: results[0].formatted_address,
                  lat: latitude,
                  lng: longitude,
                  placeId: results[0].place_id || "",
                  displayText: results[0].formatted_address,
                }, { keepSuggestions: true });
              } else {
                await applyFallbackOrCoords();
              }
            }
          );
        } else {
          await applyFallbackOrCoords();
        }
      },
      () => {
        alert("We could not access your location. Please allow access or type a location manually.");
      },
      { enableHighAccuracy: true }
    );
  }

  function handleSuggestionClick(event) {
    const target = event.target.closest(".location-suggestion");
    if (!target) return;
    event.preventDefault();

    const placeId = target.dataset.placeId;
    const primary = target.dataset.primary || target.querySelector(".location-suggestion-primary")?.textContent;
    const secondary = target.dataset.secondary || target.querySelector(".location-suggestion-secondary")?.textContent;

    hideSuggestions();

    if (placeId) {
      fetchPlaceDetails(placeId, primary || secondary);
      return;
    }

    applySelectedLocation({
      name: primary || secondary,
      address: secondary || target.dataset.address || "",
      lat: target.dataset.lat || "",
      lng: target.dataset.lng || "",
      displayText: primary || secondary,
    });
  }

  function clearLocation() {
    if (state.searchInput) state.searchInput.value = "";
    state.lastSelectionText = "";
    clearHiddenFields();
    hideSuggestions();
  }

  function collectLocationData() {
    return {
      name: (state.locationNameInput?.value || "").trim(),
      address: (state.locationAddressInput?.value || "").trim(),
      lat: (state.locationLatInput?.value || "").trim(),
      lng: (state.locationLngInput?.value || "").trim(),
      placeId: (state.locationPlaceIdInput?.value || "").trim(),
      search: (state.searchInput?.value || "").trim(),
    };
  }

  function appendToFormData(formData) {
    const data = collectLocationData();
    const name = data.name || data.search;

    formData.append("location_name", name || "");
    formData.append("location_address", data.address || "");
    formData.append("location_lat", data.lat || "");
    formData.append("location_lng", data.lng || "");
    formData.append("location_place_id", data.placeId || "");
  }

  function setFromPost(post = {}) {
    if (!post || (!post.location_name && !post.location_address)) {
      clearLocation();
      return;
    }

    applySelectedLocation({
      name: post.location_name || "",
      address: post.location_address || "",
      lat: post.location_lat ?? "",
      lng: post.location_lng ?? "",
      placeId: post.location_place_id || "",
      displayText: post.location_name || post.location_address || "",
    });
  }

  function initLocationControls() {
    state.searchInput = getEl("postLocationSearch");
    state.suggestionsEl = getEl("locationSuggestions");
    state.locationNameInput = getEl("postLocationName");
    state.locationAddressInput = getEl("postLocationAddress");
    state.locationLatInput = getEl("postLocationLat");
    state.locationLngInput = getEl("postLocationLng");
    state.locationPlaceIdInput = getEl("postLocationPlaceId");

    if (!state.searchInput) return;

    state.searchInput.addEventListener("input", handleSearchInput);

    const useBtn = getEl("useMyLocationBtn");
    if (useBtn) {
      useBtn.addEventListener("click", (event) => {
        event.preventDefault();
        handleUseMyLocation();
      });
    }

    const clearBtn = getEl("clearLocationBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", (event) => {
        event.preventDefault();
        clearLocation();
      });
    }

    if (state.suggestionsEl && !state.suggestionsBound) {
      state.suggestionsEl.addEventListener("click", handleSuggestionClick);
      state.suggestionsBound = true;
    }

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".location-search-wrapper")) {
        hideSuggestions();
      }
    });
  }

  window.PostLocation = {
    init: initLocationControls,
    reset: clearLocation,
    setFromPost,
    appendToFormData,
  };

  document.addEventListener("DOMContentLoaded", () => {
    window.PostLocation.init();
  });
})();
