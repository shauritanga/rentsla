<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Rentals</title>
</head>

<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    {{-- Header --}}
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 32px 40px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="background-color: rgba(255,255,255,0.2); width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle;">
                                        <span style="font-size: 24px; font-weight: bold; color: #ffffff;">R</span>
                                    </td>
                                    <td style="padding-left: 14px;">
                                        <p style="margin: 0; font-size: 10px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(255,255,255,0.8);">Rentals</p>
                                        <p style="margin: 2px 0 0; font-size: 16px; font-weight: 700; color: #ffffff;">Staff Portal</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding: 40px;">
                            <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a;">
                                Welcome aboard, {{ $staffName }}! 🎉
                            </h1>
                            <p style="margin: 0 0 28px; font-size: 14px; color: #64748b; line-height: 1.6;">
                                You've been added as a <strong style="color: #0f172a;">{{ ucwords(str_replace('_', ' ', $roleName)) }}</strong> on the Rentals platform
                                for <strong style="color: #0f172a;">{{ $buildingName }}</strong>.
                            </p>

                            {{-- Credentials card --}}
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 20px 24px 12px;">
                                        <p style="margin: 0; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8;">Your Login Credentials</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 24px 10px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                                                    <span style="font-size: 12px; color: #94a3b8; display: inline-block; width: 80px;">Email</span>
                                                    <span style="font-size: 14px; font-weight: 600; color: #0f172a;">{{ $email }}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="font-size: 12px; color: #94a3b8; display: inline-block; width: 80px;">Password</span>
                                                    <code style="font-size: 14px; font-weight: 600; color: #0f172a; background-color: #fef3c7; padding: 2px 8px; border-radius: 4px;">{{ $password }}</code>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            {{-- CTA Button --}}
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 12px;">
                                        <a href="{{ config('app.url') }}/login" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;">
                                            Sign In to Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            {{-- Security note --}}
                            <p style="margin: 28px 0 0; padding: 16px; background-color: #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.5;">
                                <strong>⚠️ Security Tip:</strong> Please change your password after your first login for security purposes.
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                This is an automated message from <strong>Rentals</strong>.<br>
                                Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>