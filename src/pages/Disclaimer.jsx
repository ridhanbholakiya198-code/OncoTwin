export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-bg text-ink px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="font-display text-2xl font-semibold">Research Use Disclaimer</h1>
        <p className="text-sm text-muted leading-relaxed">
          OncoTwin is an open-source, AI-assisted hypothesis generation tool intended solely to
          support oncology researchers in exploring and prioritizing ideas for further study.
        </p>
        <ul className="text-sm text-ink/90 space-y-2 list-disc list-inside">
          <li>OncoTwin is <strong>not a medical device</strong> and is not approved by any regulatory body.</li>
          <li>Nothing produced by OncoTwin is medical advice, a diagnosis, or a treatment recommendation.</li>
          <li>All outputs are hypotheses derived from existing published evidence and computational models — they are not verified discoveries and have not been validated in a lab or clinical setting.</li>
          <li>Any hypothesis generated must go through normal scientific validation (in-vitro, in-vivo, and clinical trial processes) before it has any bearing on real patient care.</li>
          <li>Patients and caregivers should not use OncoTwin to make treatment decisions. Always consult a qualified oncologist.</li>
        </ul>
        <p className="text-xs text-muted pt-4">Last updated — draft version, v0.1.</p>
      </div>
    </div>
  )
}
