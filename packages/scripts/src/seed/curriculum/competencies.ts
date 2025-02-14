import { useQuery } from "@nawadi/core";
import { schema as s } from "@nawadi/db";

export const COMPETENCY_WEDSTRIJDZEILEN_THEORIE_ID =
  "2d8db8b6-8f6e-4be9-8cf7-e7b618abc032";
export const COMPETENCY_WEDSTRIJDZEILEN_ID =
  "c0a14091-f4aa-4d31-92f6-0e8b1869f291";
export const COMPETENCY_AANKOMEN_AAN_LAGERWAL_ID =
  "81f95644-52c6-4c5c-abe0-477608e08874";
export const COMPETENCY_ZWAARDBEDIENING_ID =
  "730e7b61-7e8b-4730-9d19-b771e28e283d";
export const COMPETENCY_ZEILTRIM_ID = "495362ba-e5ec-4ddd-bc3c-9e5a7c87e253";
export const COMPETENCY_ZEILSTANDEN_ID = "0b5c678b-d61f-47cf-8210-ba3ae499c983";
export const COMPETENCY_WINDORIENTATIE_ID =
  "1bbe19d1-ebe3-4377-97c9-25fc63ae56e7";
export const COMPETENCY_AANKOMEN_MET_OPSCHIETER_ID =
  "fb27724d-2167-4cd1-b670-02dd030a668f";
export const COMPETENCY_AANKOMEN_MET_SLIPLANDING_ID =
  "19aec379-0367-4618-b060-3b171fac41c0";
export const COMPETENCY_AANSPRINGEN_ID = "23888bd3-10de-468f-9adb-fe7d4a56ef82";
export const COMPETENCY_ACHTERUIT_ZEILEN_ID =
  "ebc2c254-9096-4696-acb5-ed83edf2bcf5";
export const COMPETENCY_AFKRUISEN_ID = "93366105-b59d-4e4f-83da-12ec2cb245ee";
export const COMPETENCY_AFVAREN_VAN_HOGERWAL_ID =
  "01bc0099-aac2-43f2-90fa-b98e65277654";
export const COMPETENCY_AFVAREN_VAN_LAGERWAL_ID =
  "7897fa02-0c63-4ee7-88e9-8ca828ecf17a";
export const COMPETENCY_BOEIRONDEN_ID = "a7534986-150c-431c-b597-b8b1ee7e2495";
export const COMPETENCY_DEINZEN_ID = "f18422fc-1875-4f86-a1ab-557cbf0c6ad6";
export const COMPETENCY_GEDRAGSREGELS_ID =
  "a2d92ff2-ffd1-49af-8c1f-20c00d6bc697";
export const COMPETENCY_GESLEEPT_WORDEN_ID =
  "71bc68c1-7bf2-4c8f-816a-b5cc5f4fce7e";
export const COMPETENCY_GEWICHTSTRIM_ID =
  "72fa035d-558f-447b-a698-ae1e19cc2d76";
export const COMPETENCY_GIJPEN_ID = "505e9ee3-e045-419f-b064-29e25169928a";
export const COMPETENCY_KNOPEN_EN_LIJNEN_ID =
  "d4380175-98ea-431c-bcf2-9ea0dbf7e09c";
export const COMPETENCY_KRACHTEN_OP_HET_SCHIP_ID =
  "64dc92b5-158d-4f9c-ad92-68ac423758a3";
export const COMPETENCY_METEOROLOGIE_ID =
  "a220c6f3-9d30-4454-8a2d-f1203c35daf3";
export const COMPETENCY_OMSLAAN_VAN_DE_BOOT_ID =
  "c3c2c47d-5cea-4838-98ea-081028f93642";
export const COMPETENCY_ONDERDELEN_ID = "0a51fe9a-c2f2-4496-862a-be63c7641b93";
export const COMPETENCY_OPKRUISEN_ID = "a1e7ea85-e8c5-4f52-90c5-d35ead29ab32";
export const COMPETENCY_OPRICHTEN_VAN_DE_BOOT_ID =
  "b6ef3e11-7d98-4bf4-8d03-6013a0d8da27";
export const COMPETENCY_OPTUIGEN_EN_AFTUIGEN_ID =
  "d41aa751-6d7f-4441-b806-00c2b09a8654";
export const COMPETENCY_OPVANGEN_VAN_WINDVLAGEN_ID =
  "059ad3e8-c651-44d5-80ca-b02c37026adc";
export const COMPETENCY_OVERSTAG_ID = "ced2729c-262d-4136-bd29-cfa80c972642";
export const COMPETENCY_PLANEREN_ID = "1fd1bea7-78d0-425e-b4d0-cf3a85fa5d00";
export const COMPETENCY_POSITIE_EN_HOUDING_ID =
  "e0c81975-7c47-4f87-b586-acdf0cbb3764";
export const COMPETENCY_REGLEMENTEN_ID = "f467d674-c754-4280-a6ae-89e5e005c691";
export const COMPETENCY_REVEN_ID = "fe54b74f-b106-4ca4-8183-1682c27c6cf1";
export const COMPETENCY_ROERBEDIENING_ID =
  "14a6aeae-6c3c-40ff-81b2-1747bee6b464";
export const COMPETENCY_SCHOOTBEDIENING_ID =
  "fec916f8-3281-411e-bff3-5d4b38911b70";
export const COMPETENCY_SNELHEID_REGELEN_ID =
  "307f26da-245f-4032-b876-a0fb85842f4b";
export const COMPETENCY_STARTEN_ID = "ec99c3fd-c0eb-4911-a0ae-8d93a2c5cb2a";
export const COMPETENCY_STILLIGGEN_ID = "88c06993-759c-4628-902e-9e8cc6e049e0";
export const COMPETENCY_TACTIEKEN_ID = "3fca44d1-a535-450e-95b8-2a2004799a98";
export const COMPETENCY_VAARTERMEN_ID = "f2c3c44b-7aef-49fa-92a6-2118c46bb12e";
export const COMPETENCY_VAREN_OP_GOLVEN_ID =
  "796fa5f8-001f-403b-9fc2-31cadb4c36c4";
export const COMPETENCY_VEILIGHEID_ID = "a3259805-e01e-4189-9b39-a505b572bdc7";

export async function addCompetences() {
  const query = useQuery();

  await query.insert(s.competency).values([
    {
      id: COMPETENCY_WEDSTRIJDZEILEN_THEORIE_ID,
      handle: "wedstrijdzeilen-theorie",
      title: "Wedstrijdzeilen",
      type: "knowledge",
      weight: 911,
    },
    {
      id: COMPETENCY_WEDSTRIJDZEILEN_ID,
      handle: "wedstrijdzeilen",
      title: "Wedstrijdzeilen",
      type: "skill",
      weight: 811,
    },
    {
      id: COMPETENCY_AANKOMEN_AAN_LAGERWAL_ID,
      handle: "aankomen-aan-lagerwal",
      title: "Aankomen aan lagerwal",
      type: "skill",
      weight: 321,
    },
    {
      id: COMPETENCY_ZWAARDBEDIENING_ID,
      handle: "zwaardbediening",
      title: "Zwaardbediening",
      type: "skill",
      weight: 123,
    },
    {
      id: COMPETENCY_ZEILTRIM_ID,
      handle: "zeiltrim",
      title: "Zeiltrim",
      type: "skill",
      weight: 151,
    },
    {
      id: COMPETENCY_ZEILSTANDEN_ID,
      handle: "zeilstanden",
      title: "Zeilstanden",
      type: "skill",
      weight: 125,
    },
    {
      id: COMPETENCY_WINDORIENTATIE_ID,
      handle: "windorientatie",
      title: "Windorientatie",
      type: "skill",
      weight: 120,
    },
    {
      id: COMPETENCY_AANKOMEN_MET_OPSCHIETER_ID,
      handle: "aankomen-met-opschieter",
      title: "Aankomen met opschieter",
      type: "skill",
      weight: 316,
    },
    {
      id: COMPETENCY_AANKOMEN_MET_SLIPLANDING_ID,
      handle: "aankomen-met-sliplanding",
      title: "Aankomen met sliplanding",
      type: "skill",
      weight: 313,
    },
    {
      id: COMPETENCY_AANSPRINGEN_ID,
      handle: "aanspringen",
      title: "Aanspringen",
      type: "skill",
      weight: 502,
    },
    {
      id: COMPETENCY_ACHTERUIT_ZEILEN_ID,
      handle: "achteruit-zeilen",
      title: "Achteruit zeilen",
      type: "skill",
      weight: 506,
    },
    {
      id: COMPETENCY_AFKRUISEN_ID,
      handle: "afkruisen",
      title: "Afkruisen",
      type: "skill",
      weight: 231,
    },
    {
      id: COMPETENCY_AFVAREN_VAN_HOGERWAL_ID,
      handle: "afvaren-van-hogerwal",
      title: "Afvaren van hogerwal",
      type: "skill",
      weight: 314,
    },
    {
      id: COMPETENCY_AFVAREN_VAN_LAGERWAL_ID,
      handle: "afvaren-van-lagerwal",
      title: "Afvaren van lagerwal",
      type: "skill",
      weight: 322,
    },
    {
      id: COMPETENCY_BOEIRONDEN_ID,
      handle: "boeironden",
      title: "Boeironden",
      type: "skill",
      weight: 813,
    },
    {
      id: COMPETENCY_DEINZEN_ID,
      handle: "deinzen",
      title: "Deinzen",
      type: "skill",
      weight: 505,
    },
    {
      id: COMPETENCY_GEDRAGSREGELS_ID,
      handle: "gedragsregels",
      title: "Gedragsregels",
      type: "knowledge",
      weight: 905,
    },
    {
      id: COMPETENCY_GESLEEPT_WORDEN_ID,
      handle: "gesleept-worden",
      title: "Gesleept worden",
      type: "skill",
      weight: 141,
    },
    {
      id: COMPETENCY_GEWICHTSTRIM_ID,
      handle: "gewichtstrim",
      title: "Gewichtstrim",
      type: "skill",
      weight: 152,
    },
    {
      id: COMPETENCY_GIJPEN_ID,
      handle: "gijpen",
      title: "Gijpen",
      type: "skill",
      weight: 211,
    },
    {
      id: COMPETENCY_KNOPEN_EN_LIJNEN_ID,
      handle: "knopen-en-lijnen",
      title: "Knopen en lijnen",
      type: "knowledge",
      weight: 904,
    },
    {
      id: COMPETENCY_KRACHTEN_OP_HET_SCHIP_ID,
      handle: "krachten-op-het-schip",
      title: "Krachten op het schip",
      type: "knowledge",
      weight: 912,
    },
    {
      id: COMPETENCY_METEOROLOGIE_ID,
      handle: "meteorologie",
      title: "Meteorologie",
      type: "knowledge",
      weight: 909,
    },
    {
      id: COMPETENCY_OMSLAAN_VAN_DE_BOOT_ID,
      handle: "omslaan-van-de-boot",
      title: "Omslaan van de boot",
      type: "skill",
      weight: 166,
    },
    {
      id: COMPETENCY_ONDERDELEN_ID,
      handle: "onderdelen",
      title: "Onderdelen",
      type: "knowledge",
      weight: 901,
    },
    {
      id: COMPETENCY_OPKRUISEN_ID,
      handle: "opkruisen",
      title: "Opkruisen",
      type: "skill",
      weight: 221,
    },
    {
      id: COMPETENCY_OPRICHTEN_VAN_DE_BOOT_ID,
      handle: "oprichten-van-de-boot",
      title: "Oprichten van de boot",
      type: "skill",
      weight: 167,
    },
    {
      id: COMPETENCY_OPTUIGEN_EN_AFTUIGEN_ID,
      handle: "optuigen-en-aftuigen",
      title: "Optuigen en aftuigen",
      type: "skill",
      weight: 161,
    },
    {
      id: COMPETENCY_OPVANGEN_VAN_WINDVLAGEN_ID,
      handle: "opvangen-van-windvlagen",
      title: "Opvangen van windvlagen",
      type: "skill",
      weight: 241,
    },
    {
      id: COMPETENCY_OVERSTAG_ID,
      handle: "overstag",
      title: "Overstag",
      type: "skill",
      weight: 201,
    },
    {
      id: COMPETENCY_PLANEREN_ID,
      handle: "planeren",
      title: "Planeren",
      type: "skill",
      weight: 521,
    },
    {
      id: COMPETENCY_POSITIE_EN_HOUDING_ID,
      handle: "positie-en-houding",
      title: "Positie en houding",
      type: "skill",
      weight: 110,
    },
    {
      id: COMPETENCY_REGLEMENTEN_ID,
      handle: "reglementen",
      title: "Reglementen",
      type: "knowledge",
      weight: 906,
    },
    {
      id: COMPETENCY_REVEN_ID,
      handle: "reven",
      title: "Reven",
      type: "skill",
      weight: 169,
    },
    {
      id: COMPETENCY_ROERBEDIENING_ID,
      handle: "roerbediening",
      title: "Roerbediening",
      type: "skill",
      weight: 121,
    },
    {
      id: COMPETENCY_SCHOOTBEDIENING_ID,
      handle: "schootbediening",
      title: "Schootbediening",
      type: "skill",
      weight: 122,
    },
    {
      id: COMPETENCY_SNELHEID_REGELEN_ID,
      handle: "snelheid-regelen",
      title: "Snelheid regelen",
      type: "skill",
      weight: 312,
    },
    {
      id: COMPETENCY_STARTEN_ID,
      handle: "starten",
      title: "Starten",
      type: "skill",
      weight: 812,
    },
    {
      id: COMPETENCY_STILLIGGEN_ID,
      handle: "stilliggen",
      title: "Stilliggen",
      type: "skill",
      weight: 501,
    },
    {
      id: COMPETENCY_TACTIEKEN_ID,
      handle: "tactieken",
      title: "Tactieken",
      type: "skill",
      weight: 814,
    },
    {
      id: COMPETENCY_VAARTERMEN_ID,
      handle: "vaartermen",
      title: "Vaartermen",
      type: "knowledge",
      weight: 903,
    },
    {
      id: COMPETENCY_VAREN_OP_GOLVEN_ID,
      handle: "varen-op-golven",
      title: "Varen op golven",
      type: "skill",
      weight: 551,
    },
    {
      id: COMPETENCY_VEILIGHEID_ID,
      handle: "veiligheid",
      title: "Veiligheid",
      type: "knowledge",
      weight: 907,
    },
  ]);
}
