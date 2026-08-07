import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

import italianRegionsData from "@/data/geo/italian-regions.json";

import {
  getRegionFromCity,
  normalizeItalianRegion,
} from "@/lib/italian-regions";

import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from "geojson";

import type {
  RegionResolutionSource,
  TicketmasterEvent,
} from "@/types/ticketmaster-dto";

interface RegionProperties {
  reg_name: string;
  reg_istat_code?: string;
  reg_istat_code_num?: number;
}

type RegionFeature = Feature<
  Polygon | MultiPolygon,
  RegionProperties
>;

interface EventRegionResolution {
  region: string | null;
  source: RegionResolutionSource;
}

const italianRegions =
  italianRegionsData as FeatureCollection<
    Polygon | MultiPolygon,
    RegionProperties
  >;

function parseCoordinate(
  value: string | number | undefined,
): number | null {
  if (value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function getPoint(
  latitudeValue: string | number | undefined,
  longitudeValue: string | number | undefined,
): Feature<Point> | null {
  const latitude = parseCoordinate(latitudeValue);
  const longitude = parseCoordinate(longitudeValue);

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  
  const isInsideItalianBoundingBox =
    latitude >= 35 &&
    latitude <= 48 &&
    longitude >= 6 &&
    longitude <= 19;

    if (
        latitude === null ||
        longitude === null ||
        !isInsideItalianBoundingBox
    ) {
        return null;
    }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Point",
      coordinates: [
        longitude,
        latitude,
      ] satisfies Position,
    },
  };
}

function getRegionFromCoordinates(
  latitude: string | number | undefined,
  longitude: string | number | undefined,
): string | null {
  const point = getPoint(latitude, longitude);

  if (!point) {
    return null;
  }

  const matchingRegion = italianRegions.features.find(
    (feature): feature is RegionFeature =>
      Boolean(
        feature.properties?.reg_name &&
          booleanPointInPolygon(point, feature),
      ),
  );

  return normalizeItalianRegion(
    matchingRegion?.properties.reg_name,
  );
}

export function resolveEventRegion(
  event: TicketmasterEvent,
): EventRegionResolution {
  const venue = event._embedded?.venues?.[0];
  const place = event.place;

  const locations = [
    venue?.location,
    place?.location,
  ];

  for (const location of locations) {
    const coordinateRegion = getRegionFromCoordinates(
      location?.latitude,
      location?.longitude,
    );

    if (coordinateRegion) {
      return {
        region: coordinateRegion,
        source: "coordinates",
      };
    }
  }

  const directRegion = normalizeItalianRegion(
    venue?.state?.name ??
      venue?.state?.stateCode ??
      place?.state?.name ??
      place?.state?.stateCode,
  );

  if (directRegion) {
    return {
      region: directRegion,
      source: "state",
    };
  }

  const cityRegion = getRegionFromCity(
    venue?.city?.name ?? place?.city?.name,
  );

  if (cityRegion) {
    return {
      region: cityRegion,
      source: "city",
    };
  }

  return {
    region: null,
    source: "unresolved",
  };
}