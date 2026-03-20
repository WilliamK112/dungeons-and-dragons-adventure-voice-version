import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';

interface D20MeshProps {
  isRolling: boolean;
  value: number | null;
}

/** Precompute face normals for IcosahedronGeometry (radius 1.2, detail 0) */
function getD20FaceNormals(): THREE.Vector3[] {
  const geo = new THREE.IcosahedronGeometry(1.2, 0);
  const pos = geo.attributes.position;
  const normals: THREE.Vector3[] = [];
  for (let f = 0; f < 20; f++) {
    const i = f * 9;
    const v0 = new THREE.Vector3(pos.array[i], pos.array[i + 1], pos.array[i + 2]);
    const v1 = new THREE.Vector3(pos.array[i + 3], pos.array[i + 4], pos.array[i + 5]);
    const v2 = new THREE.Vector3(pos.array[i + 6], pos.array[i + 7], pos.array[i + 8]);
    const v01 = new THREE.Vector3().subVectors(v1, v0);
    const v02 = new THREE.Vector3().subVectors(v2, v0);
    const n = new THREE.Vector3().crossVectors(v01, v02).normalize();
    normals.push(n);
  }
  geo.dispose();
  return normals;
}

const FACE_NORMALS = getD20FaceNormals();
const TOWARD_CAMERA = new THREE.Vector3(0, 0, 1);
const TEMP_QUAT = new THREE.Quaternion();

/** 3D 二十面骰子：蓝色、未来感、发光边缘。数字所在面始终朝向相机。 */
const D20Mesh: React.FC<D20MeshProps> = ({ isRolling, value }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const spinSpeed = useRef({ x: 0.12, y: 0.18, z: 0.08 });
  const targetSpeed = useRef({ x: 0.12, y: 0.18, z: 0.08 });
  const targetQuat = useRef(new THREE.Quaternion());
  const currentQuat = useRef(new THREE.Quaternion());

  useEffect(() => {
    targetSpeed.current = isRolling ? { x: 0.12, y: 0.18, z: 0.08 } : { x: 0, y: 0, z: 0 };
  }, [isRolling]);

  useEffect(() => {
    if (!isRolling && value != null && value >= 1 && value <= 20) {
      const faceIdx = value - 1;
      const faceNormal = FACE_NORMALS[faceIdx].clone();
      TEMP_QUAT.setFromUnitVectors(faceNormal, TOWARD_CAMERA);
      targetQuat.current.copy(TEMP_QUAT);
    }
  }, [isRolling, value]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (isRolling) {
      const s = spinSpeed.current;
      const t = targetSpeed.current;
      s.x += (t.x - s.x) * 0.06;
      s.y += (t.y - s.y) * 0.06;
      s.z += (t.z - s.z) * 0.06;
      mesh.rotation.x += s.x;
      mesh.rotation.y += s.y;
      mesh.rotation.z += s.z;
      currentQuat.current.copy(mesh.quaternion); // keep in sync for smooth transition
    } else if (value != null && value >= 1 && value <= 20) {
      currentQuat.current.slerp(targetQuat.current, 0.08);
      mesh.quaternion.copy(currentQuat.current);
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <icosahedronGeometry args={[1.2, 0]} />
      <meshStandardMaterial
        color="#0f172a"
        metalness={0.85}
        roughness={0.25}
        emissive="#0e7490"
        emissiveIntensity={0.35}
      />
      <Edges color="#22d3ee" threshold={15} />
    </mesh>
  );
};

export default D20Mesh;
