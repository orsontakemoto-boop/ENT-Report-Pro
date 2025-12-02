import { ExamType } from './types';

export const EXAM_TEMPLATES: Record<ExamType, { equipment: string; preparation: string; findings: string; conclusion: string }> = {
  [ExamType.NASOSSINUSAL]: {
    equipment: "Endoscópio rígido 4mm 0 e 30 graus, fonte de luz LED, câmera HD.",
    preparation: "Anestesia tópica com lidocaína spray e vasoconstrição nasal.",
    findings: "Cavidades nasais amplas. Cornetos inferiores e médios eutróficos. Meatos médios livres. Septo nasal centrado. Rinofaringe livre com óstios tubários pérvios.",
    conclusion: "Exame dentro dos padrões de normalidade."
  },
  [ExamType.NASOFIBRO]: {
    equipment: "Nasofibroscópio flexível 3.2mm, fonte de luz LED.",
    preparation: "Anestesia tópica nasal.",
    findings: "Fossas nasais pérvias. Rinofaringe sem lesões, tonsila faríngea (adenoide) sem hipertrofia obstrutiva. Base de língua sem particularidades. Epiglote de aspecto normal. Pregas vocais móveis, com coaptação glótica completa.",
    conclusion: "Laringoscopia normal."
  },
  [ExamType.LARINGO_ESTROBO]: {
    equipment: "Laringoscópio rígido 70 graus, estroboscópio digital.",
    preparation: "Tração lingual, sem anestesia.",
    findings: "Onda mucosa presente e simétrica bilateralmente. Amplitude de vibração normal. Periodicidade regular. Fechamento glótico completo.",
    conclusion: "Exame estroboscópico sem alterações funcionais ou estruturais."
  },
  [ExamType.VEU_PALATINO]: {
    equipment: "Nasofibroscópio flexível.",
    preparation: "Sem vasoconstritor.",
    findings: "Palato mole com boa mobilidade e elevação simétrica à fonação. Fechamento velofaríngeo completo durante a fala (série de fonemas orais e nasais).",
    conclusion: "Competência velofaríngea preservada."
  },
  [ExamType.DEGLUTICAO]: {
    equipment: "Nasofibroscópio flexível, oferta de alimentos em diferentes consistências corados.",
    preparation: "Sem anestesia para preservação da sensibilidade.",
    findings: "Fase faríngea da deglutição desencadeada no tempo correto. Elevação laríngea satisfatória. Ausência de estase em valéculas ou seios piriformes. Sem sinais de penetração ou aspiração laringotraqueal.",
    conclusion: "Deglutição funcional eficaz e segura para as consistências testadas."
  }
};