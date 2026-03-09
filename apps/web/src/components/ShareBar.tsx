"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { LinkedInIcon, TwitterXIcon, WhatsAppIcon } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/button";

interface ShareBarProps {
  url: string;
  title?: string;
  text?: string;
}

const DEFAULT_TEXT = "Check out this token launch on Tally Launch";

export function ShareBar({ url, text }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const shareText = text || DEFAULT_TEXT;

  const openPopup = useCallback((href: string) => {
    window.open(href, "_blank", "width=600,height=400");
  }, []);

  const handleTwitter = useCallback(() => {
    const params = new URLSearchParams({ url, text: shareText });
    openPopup(`https://twitter.com/intent/tweet?${params}`);
  }, [url, shareText, openPopup]);

  const handleLinkedIn = useCallback(() => {
    const params = new URLSearchParams({ url });
    openPopup(`https://www.linkedin.com/sharing/share-offsite/?${params}`);
  }, [url, openPopup]);

  const handleWhatsApp = useCallback(() => {
    const params = new URLSearchParams({ text: `${shareText} ${url}` });
    openPopup(`https://wa.me/?${params}`);
  }, [url, shareText, openPopup]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handleTwitter} title="Share on X">
        <TwitterXIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleLinkedIn} title="Share on LinkedIn">
        <LinkedInIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleWhatsApp} title="Share on WhatsApp">
        <WhatsAppIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleCopy} title="Copy link">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
