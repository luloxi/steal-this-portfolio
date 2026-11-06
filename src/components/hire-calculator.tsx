"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { turnstileSiteKey } from "@/content/site";
import { useSiteSettings } from "@/components/site-settings-context";
import { useSectionShown } from "@/components/site-order-context";
import { useLocale } from "@/i18n/locale-provider";
import { MagicHr } from "@/components/magic-hr";
import { clampHours, clampProjectDays, depositPct, discountSteps, estimate, hoursDigits, PRICING, projectBreakdown, type Complexity, type Mode, type Pricing } from "@/lib/pricing";
import { useEditMode } from "@/components/admin-context";
import { PricingAdmin } from "@/components/pricing-admin";
import { charCount, clampMessage, MAX_MESSAGE, MAX_SUBSIDY_REASON } from "@/lib/hire-limits";
import { LimitModal } from "@/components/limit-modal";
import { checkCodeShape, normalizeCode, REF_PARAM, refFromCookie, CODE_MAX } from "@/lib/referrals";
