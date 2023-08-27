'use client';

import { useEffect, useRef } from "react";
import { useMap } from "../hooks/useMap";
import { Route } from "../utils/model";
import { socket } from "../utils/socket-io";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { Button, Typography } from "@mui/material";
import { RouteSelect } from "../components/RouteSelect";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function NewRoutePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useMap(mapRef);

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    }
  }, []);

  async function startRoute() {
    const routeId = (document.getElementById('route') as HTMLSelectElement).value;
    const response = await fetch(`http://localhost:3000/routes/${routeId}`);
    const route: Route = await response.json();

    map?.removeAllRoutes();

    await map?.addRouteWithIcons({
      routeId: routeId,
      startMarkerOptions: {
        position: route.directions.routes[0].legs[0].start_location
      },
      endMarkerOptions: {
        position: route.directions.routes[0].legs[0].end_location
      },
      carMarkerOptions: {
        position: route.directions.routes[0].legs[0].start_location
      }
    });

    const { steps } = route.directions.routes[0].legs[0];

    for (const step of steps) {
      await sleep(2000);
      map?.moveCar(routeId, step.start_location);
      socket.emit('new-points', {
        route_id: routeId,
        lat: step.start_location.lat,
        lng: step.start_location.lng
      })

      await sleep(2000);
      map?.moveCar(routeId, step.end_location);
      socket.emit('new-points', {
        route_id: routeId,
        lat: step.end_location.lat,
        lng: step.end_location.lng
      })
    }
  }

  return (
    <Grid2 container sx={{ display: "flex", flex: 1 }}>
      <Grid2 xs={4} px={2}>
        <Typography variant="h4">Minha Viagem</Typography>
        <div
          style={
            {
              display: "flex",
              flexDirection: "column"
            }
          }
        >
          <RouteSelect id="routes" />
          <Button type="submit" onClick={startRoute} variant="contained">
            Iniciar Viagem
          </Button>
        </div>
      </Grid2>
      <Grid2 xs={8} ref={mapRef} />
    </Grid2>
  );
}


export default NewRoutePage;