/**
 * Email templates for POAP notifications
 * Enhanced with glassmorphism effects, box shadows, and better visual cues
 */

// Asset URLs
const SSA_LOGO_URL = 'https://gateway.irys.xyz/6kCeNJbzAfJb9uhdd216nChnUTaM4kCEEUcJmhE5rezX';

// Social Links
const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/SolanaStudentAf',
  discord: 'https://discord.gg/m6CRsmeXqF',
  website: 'https://www.solanastudentsafrica.com',
};

/**
 * Generate HTML email for Participation POAP
 */
export function participationEmailTemplate({ name, wallet, network, poapImageUrl }) {
  const solscanUrl = `https://solscan.io/account/${wallet}${network === 'devnet' ? '?cluster=devnet' : ''}`;
  const displayName = name || 'Participant';

  return {
    subject: "🎉 You've received your SSA Campus Tour POAP!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSA Campus Tour POAP</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #050505;">

  <!-- Main Container -->
  <div style="max-width: 600px; margin: 0 auto;">

    <!-- Header with Logo -->
    <div style="background: linear-gradient(180deg, #0a0a0a 0%, #111111 100%); padding: 40px 24px; text-align: center;">
      <img src="${SSA_LOGO_URL}" alt="Solana Students Africa" width="160" style="max-width: 160px; height: auto;" />
    </div>

    <!-- Main Content -->
    <div style="background-color: #0a0a0a; padding: 40px 32px;">

      <!-- Greeting -->
      <div style="text-align: center; margin-bottom: 36px;">
        <p style="color: #14F195; font-size: 13px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 12px 0; font-weight: 600;">Congratulations</p>
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">${displayName}</h1>
        <p style="color: #777777; margin: 14px 0 0 0; font-size: 16px;">You've received a POAP from the SSA Campus Tour 2025</p>
      </div>

      <!-- POAP Image Card - Glassmorphism Style -->
      <div style="text-align: center; margin-bottom: 36px;">
        <div style="background: linear-gradient(145deg, rgba(153, 69, 255, 0.2) 0%, rgba(20, 241, 149, 0.2) 100%); border: 1px solid rgba(153, 69, 255, 0.3); border-radius: 20px; padding: 20px; display: inline-block; box-shadow: 0 8px 32px rgba(153, 69, 255, 0.25), 0 0 80px rgba(20, 241, 149, 0.1);">
          <img src="${poapImageUrl}" alt="SSA Campus Tour Participant POAP" width="260" style="max-width: 260px; height: auto; border-radius: 12px; display: block; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);" />
        </div>
      </div>

      <!-- POAP Title -->
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="color: #ffffff; margin: 0 0 12px 0; font-size: 24px; font-weight: 700;">SSA Campus Tour Participant 2025</h2>
        <span style="display: inline-block; background: linear-gradient(135deg, rgba(20, 241, 149, 0.2) 0%, rgba(20, 241, 149, 0.1) 100%); border: 1px solid rgba(20, 241, 149, 0.4); color: #14F195; padding: 8px 20px; border-radius: 25px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">✓ Proof of Attendance</span>
      </div>

      <!-- Description -->
      <p style="color: #bbbbbb; font-size: 16px; line-height: 1.8; text-align: center; margin: 0 0 36px 0;">
        This POAP recognizes your attendance at the Solana Students Africa Campus Tour 2025. It's now stored in your Solana wallet as a compressed NFT — your permanent proof of participation.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 44px;">
        <a href="${solscanUrl}" style="display: inline-block; background: linear-gradient(135deg, #9945FF 0%, #14F195 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 24px rgba(153, 69, 255, 0.4), 0 0 40px rgba(20, 241, 149, 0.2); letter-spacing: 0.5px;">
          View Your POAP →
        </a>
      </div>

      <!-- Instructions Box - Glass Card -->
      <div style="background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 28px; margin-bottom: 36px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);">
        <h3 style="color: #ffffff; margin: 0 0 18px 0; font-size: 16px; font-weight: 700;">
          📱 How to view in your wallet
        </h3>
        <ol style="color: #999999; margin: 0; padding-left: 20px; font-size: 15px; line-height: 2.2;">
          <li>Open <strong style="color: #ffffff;">Phantom</strong> or <strong style="color: #ffffff;">Solflare</strong> wallet</li>
          <li>Navigate to the <strong style="color: #ffffff;">Collectibles</strong> or <strong style="color: #ffffff;">NFTs</strong> tab</li>
          <li>Your POAP will appear there!</li>
        </ol>
      </div>

      <!-- Divider -->
      <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 36px 0;"></div>

      <!-- Help Section -->
      <div style="text-align: center; margin-bottom: 8px;">
        <p style="color: #666666; font-size: 14px; margin: 0;">
          Questions? Reach out to
          <a href="https://twitter.com/devvgbg" style="color: #14F195; text-decoration: underline; font-weight: 600;">@devvgbg</a>
          on Twitter
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: linear-gradient(180deg, #111111 0%, #0a0a0a 100%); padding: 36px 24px; text-align: center;">

      <!-- Social Links -->
      <div style="margin-bottom: 24px;">
        <a href="${SOCIAL_LINKS.twitter}" style="display: inline-block; background: rgba(255, 255, 255, 0.1); color: #ffffff; text-decoration: none; margin: 0 6px; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.15);">Twitter</a>
        <a href="${SOCIAL_LINKS.discord}" style="display: inline-block; background: rgba(255, 255, 255, 0.1); color: #ffffff; text-decoration: none; margin: 0 6px; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.15);">Discord</a>
        <a href="${SOCIAL_LINKS.website}" style="display: inline-block; background: rgba(255, 255, 255, 0.1); color: #ffffff; text-decoration: none; margin: 0 6px; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.15);">Website</a>
      </div>

      <!-- Copyright -->
      <p style="color: #444444; font-size: 12px; margin: 0;">
        © 2025 Solana Students Africa. All rights reserved.
      </p>

    </div>

  </div>

</body>
</html>
    `.trim()
  };
}

/**
 * Generate HTML email for Builder POAP
 */
export function builderEmailTemplate({ name, wallet, network, transactionCount, poapImageUrl }) {
  const solscanUrl = `https://solscan.io/account/${wallet}${network === 'devnet' ? '?cluster=devnet' : ''}`;
  const displayName = name || 'Builder';
  const txCount = transactionCount || 'Multiple';

  return {
    subject: "🏆 You've earned the SSA Builder POAP — You Shipped!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSA Builder POAP</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #050505;">

  <!-- Main Container -->
  <div style="max-width: 600px; margin: 0 auto;">

    <!-- Header with Logo -->
    <div style="background: linear-gradient(180deg, #0a0a0a 0%, #111111 100%); padding: 40px 24px; text-align: center;">
      <img src="${SSA_LOGO_URL}" alt="Solana Students Africa" width="160" style="max-width: 160px; height: auto;" />
    </div>

    <!-- Premium Banner -->
    <div style="background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%); padding: 14px 24px; text-align: center; box-shadow: 0 4px 20px rgba(255, 107, 0, 0.4);">
      <span style="color: #000000; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">✓ Verified On-Chain Builder</span>
    </div>

    <!-- Main Content -->
    <div style="background-color: #0a0a0a; padding: 40px 32px;">

      <!-- Greeting -->
      <div style="text-align: center; margin-bottom: 36px;">
        <p style="color: #FFD700; font-size: 13px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 12px 0; font-weight: 600;">You Shipped On-Chain</p>
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">${displayName}</h1>
        <p style="color: #777777; margin: 14px 0 0 0; font-size: 16px;">You've earned the exclusive Builder POAP</p>
      </div>

      <!-- POAP Image Card - Premium Gold Glass Style -->
      <div style="text-align: center; margin-bottom: 36px;">
        <div style="background: linear-gradient(145deg, rgba(255, 107, 0, 0.15) 0%, rgba(255, 215, 0, 0.15) 100%); border: 2px solid rgba(255, 215, 0, 0.4); border-radius: 20px; padding: 20px; display: inline-block; box-shadow: 0 8px 32px rgba(255, 107, 0, 0.3), 0 0 80px rgba(255, 215, 0, 0.15);">
          <img src="${poapImageUrl}" alt="SSA Campus Tour Builder POAP" width="260" style="max-width: 260px; height: auto; border-radius: 12px; display: block; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);" />
        </div>
      </div>

      <!-- POAP Title -->
      <div style="text-align: center; margin-bottom: 28px;">
        <h2 style="color: #ffffff; margin: 0 0 12px 0; font-size: 24px; font-weight: 700;">SSA Campus Tour Builder 2025</h2>
        <span style="display: inline-block; background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%); border: 1px solid rgba(255, 215, 0, 0.5); color: #FFD700; padding: 8px 20px; border-radius: 25px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">⭐ Verified Builder</span>
      </div>

      <!-- Stats Box - Prominent Glass Card -->
      <div style="background: linear-gradient(145deg, rgba(255, 107, 0, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 32px; box-shadow: 0 4px 24px rgba(255, 107, 0, 0.2);">
        <p style="color: #FFD700; font-size: 48px; font-weight: 800; margin: 0; text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);">${txCount}</p>
        <p style="color: #888888; font-size: 14px; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">on-chain transactions verified</p>
      </div>

      <!-- Description -->
      <p style="color: #bbbbbb; font-size: 16px; line-height: 1.8; text-align: center; margin: 0 0 28px 0;">
        This POAP verifies that you didn't just attend — you <strong style="color: #ffffff;">shipped</strong>. Your on-chain activity during the SSA Campus Tour 2025 has been verified, and you've earned exclusive access to builder benefits.
      </p>

      <!-- Benefits Box - Glass Card -->
      <div style="background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%); border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 16px; padding: 28px; margin-bottom: 36px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);">
        <h3 style="color: #FFD700; margin: 0 0 18px 0; font-size: 16px; font-weight: 700;">
          🏆 Builder Privileges Unlocked
        </h3>
        <ul style="color: #bbbbbb; margin: 0; padding-left: 20px; font-size: 15px; line-height: 2.2;">
          <li>Early access to <strong style="color: #ffffff;">SSA Builder Programs</strong></li>
          <li>Eligibility for <strong style="color: #ffffff;">Builder Spotlight</strong> features</li>
          <li>Priority consideration for <strong style="color: #ffffff;">future opportunities</strong></li>
          <li>Access to exclusive <strong style="color: #ffffff;">builder channels</strong></li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 44px;">
        <a href="${solscanUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%); color: #000000; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 800; font-size: 16px; box-shadow: 0 4px 24px rgba(255, 107, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3); letter-spacing: 0.5px;">
          View Your Builder POAP →
        </a>
      </div>

      <!-- Instructions Box - Glass Card -->
      <div style="background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 28px; margin-bottom: 36px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);">
        <h3 style="color: #ffffff; margin: 0 0 18px 0; font-size: 16px; font-weight: 700;">
          📱 How to view in your wallet
        </h3>
        <ol style="color: #999999; margin: 0; padding-left: 20px; font-size: 15px; line-height: 2.2;">
          <li>Open <strong style="color: #ffffff;">Phantom</strong> or <strong style="color: #ffffff;">Solflare</strong> wallet</li>
          <li>Navigate to the <strong style="color: #ffffff;">Collectibles</strong> or <strong style="color: #ffffff;">NFTs</strong> tab</li>
          <li>Your Builder POAP will appear there!</li>
        </ol>
      </div>

      <!-- Divider -->
      <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 36px 0;"></div>

      <!-- Help Section -->
      <div style="text-align: center; margin-bottom: 8px;">
        <p style="color: #666666; font-size: 14px; margin: 0;">
          Questions? Reach out to
          <a href="https://twitter.com/devvgbg" style="color: #FFD700; text-decoration: underline; font-weight: 600;">@devvgbg</a>
          on Twitter
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: linear-gradient(180deg, #111111 0%, #0a0a0a 100%); padding: 36px 24px; text-align: center;">

      <!-- Social Links - Button Style -->
      <div style="margin-bottom: 24px;">
        <a href="${SOCIAL_LINKS.twitter}" style="display: inline-block; background: rgba(255, 215, 0, 0.1); color: #FFD700; text-decoration: none; margin: 0 6px; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255, 215, 0, 0.3);">Twitter</a>
        <a href="${SOCIAL_LINKS.discord}" style="display: inline-block; background: rgba(255, 215, 0, 0.1); color: #FFD700; text-decoration: none; margin: 0 6px; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255, 215, 0, 0.3);">Discord</a>
        <a href="${SOCIAL_LINKS.website}" style="display: inline-block; background: rgba(255, 215, 0, 0.1); color: #FFD700; text-decoration: none; margin: 0 6px; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255, 215, 0, 0.3);">Website</a>
      </div>

      <!-- Copyright -->
      <p style="color: #444444; font-size: 12px; margin: 0;">
        © 2025 Solana Students Africa. All rights reserved.
      </p>

    </div>

  </div>

</body>
</html>
    `.trim()
  };
}

export { SSA_LOGO_URL, SOCIAL_LINKS };
export default { participationEmailTemplate, builderEmailTemplate };
