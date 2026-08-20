import { withAuth } from "@/utils/withAuth";
import { successResponse, errorResponse } from "@/utils/response";
import { db } from "@/lib/configs/firebase";



export const GET = withAuth(async (req) => {
  try {

    const { searchParams } = new URL(req.url);
    const layoutId = searchParams.get("layoutId");

    if (!layoutId) {
      return errorResponse("layoutId is required", 400);
    }

    //
    const snapshot = await db.ref(`sensorHistory/${layoutId}`).once("value");
    const data = snapshot.val() || {};

    const history = Object.entries(data).map(([key, value]) => ({
      id: key,
      ...value,
    }));

    return successResponse(history);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});

export const POST = withAuth(async (req) => {
  try {
    const { layoutId } = await req.json();

    const layoutSnapshot = await db.ref(`layouts/${layoutId}`).once("value");
    const layout = layoutSnapshot.val();

    if (!layout) {
      return errorResponse("Layout not found", 404);
    }

    const sensorsSnapshot = await db.ref("sensors").once("value");
    const sensors = sensorsSnapshot.val() || {};

    const sensorBySpotId = {};
    for (const sensor of Object.values(sensors)) {
      if (sensor && sensor.spotId) {
        sensorBySpotId[sensor.spotId] = sensor;
      }
    }

    let totalSlots = 0;
    let occupiedSlots = 0;
    let vacantSlots = 0;

    const grid = Array.isArray(layout.grid) ? layout.grid : Object.values(layout.grid || {});

    for (const row of grid) {
      const cells = Array.isArray(row) ? row : Object.values(row || {});

      for (const cell of cells) {
        if (!cell || cell.type !== "slot") continue;

        totalSlots++;

        const spotId =
          cell.spotId ||
          cell.spotData?.slotId ||
          cell.spotData?.spotId;

        const sensor = spotId ? sensorBySpotId[spotId] : null;

        const rawStatus =
          sensor?.status ??
          cell.spotData?.status ??
          "free";

        const status = String(rawStatus).toLowerCase();
        const normalized =
          status === "available" ? "free" :
          status === "occupied" ? "occupied" :
          status === "free" ? "free" :
          "free";

        if (normalized === "occupied") {
          occupiedSlots++;
        } else {
          vacantSlots++;
        }
      }
    }

    const snapshot = {
      layoutId,
      timestamp: Date.now(),
      day: new Date().toISOString().split("T")[0],
      hour: new Date().getHours(),
      totalSlots,
      occupiedSlots,
      vacantSlots,
      occupancyRate: totalSlots ? occupiedSlots / totalSlots : 0,
    };

    await db.ref(`sensorHistory/${layoutId}`).push(snapshot);

    return successResponse({ message: "History saved", data: snapshot }, 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});

