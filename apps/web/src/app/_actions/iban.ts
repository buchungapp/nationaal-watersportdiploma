export function smellsLikeIban(str: string) {
  return /^([A-Z]{2}[ \-]?[0-9]{2})(?=(?:[ \-]?[A-Z0-9]){9,30}$)((?:[ \-]?[A-Z0-9]{3,5}){2,7})([ \-]?[A-Z0-9]{1,3})?$/.test(
    str,
  );
}

export function validateIbanChecksum(iban: string): boolean {
  const ibanStripped = iban
    .replace(/[^A-Z0-9]+/gi, "") //keep numbers and letters only
    .toUpperCase(); //calculation expects upper-case
  const m = ibanStripped.match(/^([A-Z]{2})([0-9]{2})([A-Z0-9]{9,30})$/);
  if (!m || !m[3] || !m[1] || !m[2]) return false;

  const numbericed = (m[3] + m[1] + m[2]).replace(/[A-Z]/g, (ch: string) => {
    //replace upper-case characters by numbers 10 to 35
    return String(ch.charCodeAt(0) - 55);
  });
  //The resulting number would be to long for javascript to handle without loosing precision.
  //So the trick is to chop the string up in smaller parts.
  const mod97 = numbericed
    .match(/\d{1,7}/g)
    ?.reduce(
      (total: string, curr: string) => String(Number(total + curr) % 97),
      "",
    );

  return mod97 === "1";
}
