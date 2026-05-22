import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/utils/withAuth";
import { createSpot, getSpotsByOwner } from "@/services/spotService";
import { getSensorBySpot } from "@/services/sensorService";
import { db } from "@/lib/configs/firebase";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const spots = await getSpotsByOwner(req.user.uid);
    const spotsWithSensor = await Promise.all(
      spots.map(async (spot) => {
        const sensor = await getSensorBySpot(spot.slotId);

        // Get layout information if spot has layoutId
        let layoutInfo = null;
        if (spot.layoutId) {
          try {
            const layoutSnapshot = await db.ref(`layouts/${spot.layoutId}`).once('value');
            const layout = layoutSnapshot.val();
            if (layout) {
              let gridRow = spot.rowNo ?? null;
              let gridCol = spot.columnNo ?? null;

              if ((gridRow === null || gridRow === "" || gridCol === null || gridCol === "") && layout.grid) {
                for (let row = 0; row < layout.grid.length; row++) {
                  for (let col = 0; col < layout.grid[row].length; col++) {
                    const cell = layout.grid[row][col];
                    if (cell?.type === "slot" && cell.spotId === spot.slotId) {
                      gridRow = row + 1;
                      gridCol = col + 1;
                      break;
                    }
                  }
                  if (gridRow !== null && gridCol !== null) break;
                }
              }

              layoutInfo = {
                layoutName: layout.layoutName || "Unnamed Layout",
                gridRow,
                gridCol,
              };
            }
          } catch (error) {
            console.error(`Error fetching layout ${spot.layoutId}:`, error);
          }
        }

        return {
          ...spot,
          sensor,
          layoutInfo,
        };
      })
    );
    return NextResponse.json({ success: true, data: spotsWithSensor });
  } catch (err: any) {
    console.error("GET /api/spots error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    if (!body) throw new Error("Missing request body");

    const { slotName, vehicleType, rowNo, columnNo, layoutId, lotId, floor } = body;

    if (!slotName || !vehicleType) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const userId = (req as any).user.uid;

    // Create spot in Firebase; layout values can be assigned later
    const spot = await createSpot({
      slotName,
      vehicleType,
      rowNo: rowNo ?? '',
      columnNo: columnNo ?? '',
      layoutId: layoutId ?? '',
      lotId: lotId ?? '',
      floor: floor ?? '',
      status: "available",
      ownerId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ message: "Spot created", data: spot }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/spots error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
});