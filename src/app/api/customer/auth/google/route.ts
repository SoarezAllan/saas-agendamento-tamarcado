import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createAuthResponse } from '@/lib/auth';

// Helper to decode JWT payload without external library
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { credential, email, name, avatarUrl, googleId, phone } = body;

    // If a Google Credential JWT was passed, decode it
    if (credential) {
      const decoded = decodeJwtPayload(credential);
      if (decoded && decoded.email) {
        email = decoded.email;
        name = decoded.name || decoded.given_name || name;
        avatarUrl = decoded.picture || avatarUrl;
        googleId = decoded.sub || googleId;
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Não foi possível obter o e-mail da conta Google.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

    // Check if customer exists by googleId or email
    let customer = await db.customer.findFirst({
      where: {
        OR: [
          ...(googleId ? [{ googleId }] : []),
          { email: cleanEmail },
        ],
      },
    });

    if (customer) {
      // Update customer with googleId and mark verified
      customer = await db.customer.update({
        where: { id: customer.id },
        data: {
          googleId: googleId || customer.googleId,
          emailVerified: true,
          avatarUrl: avatarUrl || customer.avatarUrl,
          name: customer.name || name || 'Cliente Google',
          ...(cleanPhone && !customer.phone ? { phone: cleanPhone } : {}),
        },
      });
    } else {
      // Create new customer
      customer = await db.customer.create({
        data: {
          email: cleanEmail,
          name: name || 'Cliente Google',
          phone: cleanPhone || '',
          googleId,
          avatarUrl,
          emailVerified: true,
        },
      });
    }

    // Link any previous unlinked appointments by email
    await db.appointment.updateMany({
      where: {
        customerEmail: cleanEmail,
        customerId: null,
      },
      data: {
        customerId: customer.id,
      },
    });

    const sessionPayload = {
      userId: customer.id,
      customerId: customer.id,
      email: customer.email || cleanEmail,
      name: customer.name,
      phone: customer.phone,
      role: 'CUSTOMER' as const,
    };

    return createAuthResponse(
      {
        message: 'Login com Google realizado com sucesso!',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          avatarUrl: customer.avatarUrl,
          emailVerified: true,
        },
      },
      sessionPayload,
      200
    );
  } catch (error: any) {
    console.error('Customer Google Auth Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao autenticar com o Google.' },
      { status: 500 }
    );
  }
}
