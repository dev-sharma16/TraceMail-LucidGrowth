export function parseReceivedHeaders(receivedHeaders: string[] = []) {
  // Received headers usually stack newest-first; reverse for sender->recipient
  const reversed = receivedHeaders.slice().reverse();
  return reversed.map((h) => {
    const regex = /from\s+(.+?)\s+by\s+(.+?)(?:\s+with\s+(.+?))?(?:\s+id\s+(.+?))?(?:\s+for\s+(.+?))?;?\s*(.*)$/i;
    const m = h.match(regex);
    const ipMatch = h.match(/\[?(\d{1,3}(?:\.\d{1,3}){3})\]?/);
    return {
      from: m?.[1]?.trim() || null,
      by: m?.[2]?.trim() || null,
      with: m?.[3]?.trim() || null,
      id: m?.[4]?.trim() || null,
      for: m?.[5]?.trim() || null,
      date: m?.[6]?.trim() || null,
      ip: ipMatch ? ipMatch[1] : null,
      raw: h,
    };
  });
}

export function detectESP(headerMap: Map<string, any>, receivingChain: any[], fromAddress?: string) {
  const headers: Record<string, string> = {};
  for (const [k, v] of headerMap.entries()) headers[k.toLowerCase()] = String(v);

  const reasons: string[] = [];

  if (headers['x-ses-message-id'] || JSON.stringify(receivingChain).toLowerCase().includes('amazonses')) {
    reasons.push('X-SES header / amazonses detected');
    return { provider: 'Amazon SES', confidence: 'high', reasons };
  }
  if (headers['x-sg-id'] || JSON.stringify(receivingChain).toLowerCase().includes('sendgrid')) {
    reasons.push('SendGrid header / hostname detected');
    return { provider: 'SendGrid', confidence: 'high', reasons };
  }
  if (headers['x-mailgun-sending-ip'] || JSON.stringify(receivingChain).toLowerCase().includes('mailgun')) {
    reasons.push('Mailgun header/hostname detected');
    return { provider: 'Mailgun', confidence: 'high', reasons };
  }
  if (JSON.stringify(receivingChain).toLowerCase().includes('google')) {
    reasons.push('Google/Gmail hostname or headers');
    return { provider: 'Gmail', confidence: 'high', reasons };
  }
  if (fromAddress) {
    const domain = fromAddress.split('@')[1];
    reasons.push(`No provider headers: fallback to sender domain ${domain}`);
    return { provider: domain, confidence: 'low', reasons };
  }

  return { provider: 'Unknown', confidence: 'none', reasons: ['No signals found'] };
}
