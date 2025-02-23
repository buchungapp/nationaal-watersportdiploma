export type CertificateTemplate = {
  id: string;
  additionalSearchTag?: string;
  category?: string;
} & (
  | {
      issuingAuthority?: never;
      title: string;
    }
  | {
      issuingAuthority: string;
      title?: never;
    }
  | {
      issuingAuthority: string;
      title: string;
    }
);

export const certificateTemplates: CertificateTemplate[] = [
  // TODO: add all certificates related to watersports

  {
    id: "cwo",
    issuingAuthority: "CWO",
    category: "zeilen",
  },
  {
    id: "cwo-zwaardboot-1mans-jeugd-basis",
    issuingAuthority: "CWO",
    title: "Zwaardboot 1mans Jeugd Basis (I)",
    category: "zeilen",
  },
  // TODO: add all CWO certificates

  {
    id: "cbr-klein-vaarbewijs-1",
    issuingAuthority: "CBR",
    title: "Klein Vaarbewijs I",
    category: "vaarbewijzen",
  },
  {
    id: "cbr-klein-vaarbewijs-2",
    issuingAuthority: "CBR",
    title: "Klein Vaarbewijs II",
    category: "vaarbewijzen",
  },
  {
    id: "cbr-groot-plezier-vaarbewijs-2",
    issuingAuthority: "CBR",
    title: "Groot Pleziervaarbewijs II",
    category: "vaarbewijzen",
  },
  // TODO: add all vaarbewijs certificates

  // Marifoon from: https://www.rdi.nl/onderwerpen/marifoons-en-overige-maritieme-communicatieapparatuur/examen-en-bedieningscertificaten
  {
    id: "cbr-basis-certificaat-marifonie",
    issuingAuthority: "CBR",
    title: "Basis Certificaat marifonie",
    category: "marifonie",
  },
  {
    id: "cbr-marcom-b",
    issuingAuthority: "CBR",
    title: "Beperkt Certificaat Maritieme Radiocommunicatie (Marcom-B)",
    category: "marifonie",
  },
  {
    id: "cbr-marcom-a",
    issuingAuthority: "CBR",
    title: "Algemeen Certificaat Maritieme Radiocommunicatie (Marcom-A)",
    category: "marifonie",
  },

  // All EHBO from: https://www.rijksoverheid.nl/documenten/regelingen/2017/09/19/lijst-certificaten-kinder-ehbo
  {
    id: "orangje-kruis-eerste-hulp-aan-kinderen",
    issuingAuthority: "Het Oranje Kruis",
    title: "Eerste Hulp aan Kinderen",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "orangje-kruis-eerste-hulp",
    issuingAuthority: "Het Oranje Kruis",
    title: "Eerste Hulp",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "nedcert-sehso",
    issuingAuthority: "NedCert",
    title: "Spoedeisende Hulpverlening bij Slachtoffers (SEHSO)",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "nikta-acute-zorg-kinderen",
    issuingAuthority: "NIKTA",
    title: "Acute Zorg bij kinderen",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "nikta-bedrijfshulpverlener-kind-omgeving",
    issuingAuthority: "NIKTA",
    title: "Bedrijfshulpverlener Module Kind en Omgeving",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "nikta-acute-zorgverlener-kind-omgeving",
    issuingAuthority: "NIKTA",
    title: "Acute Zorgverlener Module Kind en Omgeving",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "nikta-eerstehulpverlener-medic-fire",
    issuingAuthority: "NIKTA",
    title: "Eerstehulpverlener Medic & Fire First Aid ® Europe Course",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "nedcert-sehbk",
    issuingAuthority: "NedCert",
    title: "Spoedeisende Hulpverlening bij Kinderen (SEHBK)",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "nvb-acute-zorg-kind-omgeving",
    issuingAuthority: "Nederlandse Vereniging Bedrijfshulpverlening",
    title: "Acute Zorg aan Kind en Omgeving",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "lpev-basis-eerstehulpverlener",
    issuingAuthority: "Stichting LPEV",
    title:
      "Basis Eerstehulpverlener-LPEV met de aantekening Eerste hulp aan Kinderen",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "rode-kruis-eerste-hulp-babys-kinderen",
    issuingAuthority: "Nederlandse Rode Kruis",
    title: "Eerste Hulp aan Baby's en Kinderen",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "nib-eerste-hulp-werken-met-kinderen",
    issuingAuthority: "Nederlands Instituut voor Bedrijfshulpverlening",
    title: "Eerste Hulp bij werken met kinderen",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "cibot-amr3-ehak-ikk",
    issuingAuthority: "CIBOT",
    title:
      "Advanced Medical Responder: Eerste hulp Aan Kinderen (AMR3: EHAK IKK)",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "cibot-bedrijfshulpverlening-kind",
    issuingAuthority: "CIBOT",
    title: "Bedrijfshulpverlening Kind",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
  {
    id: "livis-eerste-hulp-onderwijs-babys-kinderen",
    issuingAuthority: "Livis",
    title: "Eerste Hulp Bij Ongelukken onderwijs voor baby's en kinderen",
    additionalSearchTag: "EHBO",
    category: "veiligheid",
  },
];
