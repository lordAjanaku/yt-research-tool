export function getQualifies({ subs, chMult, length, comments, threshold = 4 }) {
  return (
    subs < 200 &&
    chMult >= threshold &&
    length >= 7 &&
    comments !== 'Yes'
  )
}
