function getThreshold(zoom: number) {
  // Example: zoom 11 = 0.001, zoom 15 = 0.0001
  return 0.001 / Math.pow(2, zoom - 11);
}

export default function groupingPoint(
  points: { position: [number, number] }[],
  zoom: number = 15,
) {
  const threshold = getThreshold(zoom);
  const clusters: {
    center: [number, number];
    points: { position: [number, number] }[];
  }[] = [];

  points.forEach((p) => {
    let found = false;

    for (const cluster of clusters) {
      const dx = p.position[0] - cluster.center[0];
      const dy = p.position[1] - cluster.center[1];
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < threshold) {
        cluster.points.push(p);

        // recompute center
        const total = cluster.points.length;
        cluster.center[0] =
          (cluster.center[0] * (total - 1) + p.position[0]) / total;
        cluster.center[1] =
          (cluster.center[1] * (total - 1) + p.position[1]) / total;

        found = true;
        break;
      }
    }

    if (!found) {
      clusters.push({
        center: [...p.position],
        points: [p],
      });
    }
  });

  return clusters;
}
