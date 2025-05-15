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
        const res = await fetchBoundaryGeometry(boundaryType, name)
        if (canceled) {
          return
        }

        const geom = res.geometry
        if (!geom) {
          return
        }

        // 1) raw coordinate array 추출
        let rings = []
        if (geom.type === 'Polygon') {
          rings = [geom.coordinates[0]]
        } else if (geom.type === 'MultiPolygon') {
          rings = geom.coordinates.map(poly => poly[0])
        } else {
          return
        }

        if (!rings.length) {
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

        polygonRef.current.push(polygon)
      } catch (err) {
        // 에러 처리는 필요에 따라 유지하거나 다른 방식으로 변경할 수 있습니다.
        // 예를 들어, 사용자에게 알림을 표시하거나 로깅 서비스로 에러를 전송할 수 있습니다.
      }
    })()

    return () => {
      canceled = true
      polygonRef.current.forEach(p => p.setMap(null))
      polygonRef.current = []
    }
  }, [map, boundaryType, name, style]) // style을 의존성 배열에 추가하는 것이 좋습니다.

  return null
}

export default BoundaryPolygon