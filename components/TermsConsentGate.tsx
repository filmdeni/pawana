"use client";

import { useState } from "react";
import TermsConsentModal from "./TermsConsentModal";

interface Props {
  hasAccepted: boolean;
}

export default function TermsConsentGate({ hasAccepted }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (hasAccepted || dismissed) return null;

  return <TermsConsentModal onAccept={() => setDismissed(true)} />;
}
