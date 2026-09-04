import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db`SELECT NOW() as current_time, current_database() as db_name`;
    
    return NextResponse.json({ 
      status: 'connected', 
      time: result.rows[0].current_time,
      database: result.rows[0].db_name,
      env_check: process.env.POSTGRES_URL ? 'exists' : 'missing'
    });
  } catch (error: any) {
    console.error('DB_TEST_ERROR:', error.message);
    return NextResponse.json({ 
      status: 'failed', 
      error: error.message,
      env_check: process.env.POSTGRES_URL ? 'exists' : 'missing'
    }, { status: 500 });
  }
}
