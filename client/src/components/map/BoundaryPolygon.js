// src/components/map/BoundaryPolygon.js
import React, { useEffect, useRef } from 'react'
import { fetchBoundaryGeometry } from '../../service/api'

const BoundaryPolygon = ({ map, boundaryType, name, style }) => {
  const polygonRef = useRef([])

  useEffect(() => {
    if (!map || !boundaryType || !name) return
    let canceled = false

    ;(async () => {
      try {
        console.log(`[BoundaryPolygon] 시작 → type: ${boundaryType}, name: ${name}`)
        const res = await fetchBoundaryGeometry(boundaryType, name)
        if (canceled) {
          console.warn(`[BoundaryPolygon] 취소됨 → type: ${boundaryType}, name: ${name}`)
          return
        }

        const geom = res.geometry
        if (!geom) {
          console.error(`[BoundaryPolygon] geometry 없음 → type: ${boundaryType}, name: ${name}`, res)
          return
        }

        // 1) raw coordinate array 추출
        let rings = []
        if (geom.type === 'Polygon') {
          rings = [geom.coordinates[0]]
        } else if (geom.type === 'MultiPolygon') {
          rings = geom.coordinates.map(poly => poly[0])
        } else {
          console.error(
            `[BoundaryPolygon] 지원 안 되는 geometry.type → ${geom.type}`,
            geom
          )
          return
        }

        if (!rings.length) {
          console.error(
            `[BoundaryPolygon] 추출된 링 없음 → type: ${boundaryType}, name: ${name}`
          )
          return
        }

        // 2) 가장 큰 링(본토)만 골라서
        const outer = rings.reduce(
          (max, curr) => (curr.length > max.length ? curr : max),
          rings[0]
        )

        // 3) 이전 폴리곤 제거
        polygonRef.current.forEach(p => p.setMap(null))
        polygonRef.current = []

        // 4) 네이버 예제처럼 paths 생성
        const latlngs = outer.map(
          ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
        )
        if (!latlngs.length) {
          console.error(
            `[BoundaryPolygon] latlngs 변환 실패 → type: ${boundaryType}, name: ${name}`
          )
          return
        }

        const polygon = new window.naver.maps.Polygon({
          map,
          paths: [latlngs],
          strokeColor: style?.strokeColor || '#ff0000',
          strokeOpacity: style?.strokeOpacity ?? 0.6,
          strokeWeight: style?.strokeWeight ?? 3,
          fillColor: style?.fillColor || '#ff0000',
          fillOpacity: style?.fillOpacity ?? 0.3,
          zIndex: style?.zIndex ?? 1000
        })

        console.log(
          `[BoundaryPolygon] 폴리곤 생성 성공 → type: ${boundaryType}, name: ${name}`
        )
        polygonRef.current.push(polygon)
      } catch (err) {
        console.error(
          `[BoundaryPolygon] load failure → type: ${boundaryType}, name: ${name}`,
          err
        )
      }
    })()

    return () => {
      canceled = true
      polygonRef.current.forEach(p => p.setMap(null))
      polygonRef.current = []
    }
  }, [map, boundaryType, name])

  return null
}

export default BoundaryPolygon