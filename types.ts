export enum ExamType {
  NASOSSINUSAL = 'Video-endoscopia Nasossinusal',
  NASOFIBRO = 'Video-nasofibrolaringoscopia',
  LARINGO_ESTROBO = 'Video-laringo-estroboscopia',
  VEU_PALATINO = 'Video-endoscopia do Véu Palatino',
  DEGLUTICAO = 'Video-endoscopia da Deglutição (FEES)'
}

export interface DoctorInfo {
  name: string;
  crm: string;
  rqe: string;
  clinicName: string;
  address: string;
  phone: string;
}

export interface PatientInfo {
  name: string;
  age: string;
  sex: 'Masculino' | 'Feminino' | 'Outro';
  date: string;
}

export interface ExamData {
  type: ExamType;
  equipment: string;
  preparation: string;
  findings: string;
  conclusion: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  blob?: Blob;
  timestamp: number;
}