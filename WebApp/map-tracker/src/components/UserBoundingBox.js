import React, { useEffect, useState } from "react";
import { Rectangle, useMap } from "react-leaflet";
import { ref, get } from "firebase/database";
import { database } from "../firebase";

const FitBoundsToBox = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, bounds]);

  return null;
};

const UserBoundingBox = ({ userId }) => {
  const [boundingBoxes, setBoundingBoxes] = useState({
    permanent: null,
    residential: null,
  });

  useEffect(() => {
    if (!userId) return;

    const userRef = ref(database, `users/${userId}`);

    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          const permanentBox = userData.permanentAddressData?.boundingBox;
          const residentialBox = userData.residentialAddressData?.boundingBox;

          if (permanentBox) {
            setBoundingBoxes((prev) => ({
              ...prev,
              permanent: [
                [permanentBox.ymin, permanentBox.xmin],
                [permanentBox.ymax, permanentBox.xmax],
              ],
            }));
          }

          if (residentialBox) {
            setBoundingBoxes((prev) => ({
              ...prev,
              residential: [
                [residentialBox.ymin, residentialBox.xmin],
                [residentialBox.ymax, residentialBox.xmax],
              ],
            }));
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching bounding box data:", error);
      });
  }, [userId]);

  if (!boundingBoxes.permanent && !boundingBoxes.residential) return null;

  return (
    <>
      {boundingBoxes.permanent && (
        <Rectangle
          bounds={boundingBoxes.permanent}
          pathOptions={{ color: "green", weight: 2, fillOpacity: 0.1 }}
        />
      )}
      {boundingBoxes.residential && (
        <Rectangle
          bounds={boundingBoxes.residential}
          pathOptions={{ color: "green", weight: 2, fillOpacity: 0.1 }}
        />
      )}
      <FitBoundsToBox
        bounds={boundingBoxes.residential || boundingBoxes.permanent }
      />
    </>
  );
};

export default UserBoundingBox;
