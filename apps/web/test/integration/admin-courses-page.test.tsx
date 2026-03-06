import { render, screen } from '@testing-library/react';

interface CourseRow {
  id: string;
  title: string;
  description: string;
  level: string;
  price_cents: number;
  duration_hours: number;
  image_url: string | null;
  is_active: boolean;
}

interface SessionRow {
  id: string;
  course_id: string;
  start_at: string;
  capacity: number;
  location: string;
  status: string;
}

interface EnrollmentRow {
  id: string;
  session_id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
  course_sessions: { course_id: string };
}

function createSupabaseServerMock({
  courses,
  sessions,
  enrollments,
}: {
  courses: CourseRow[];
  sessions: SessionRow[];
  enrollments: EnrollmentRow[];
}) {
  const coursesQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
  };
  coursesQuery.select.mockReturnValue(coursesQuery);
  coursesQuery.eq.mockReturnValue(coursesQuery);
  coursesQuery.order.mockResolvedValue({ data: courses });

  const sessionsQuery = {
    select: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
  };
  sessionsQuery.select.mockReturnValue(sessionsQuery);
  sessionsQuery.in.mockReturnValue(sessionsQuery);
  sessionsQuery.order.mockResolvedValue({ data: sessions });

  const enrollmentsQuery = {
    select: vi.fn(),
    order: vi.fn(),
  };
  enrollmentsQuery.select.mockReturnValue(enrollmentsQuery);
  enrollmentsQuery.order.mockResolvedValue({ data: enrollments });

  return {
    from: vi.fn((table: string) => {
      if (table === 'courses') {
        return coursesQuery;
      }
      if (table === 'course_sessions') {
        return sessionsQuery;
      }
      if (table === 'course_enrollments') {
        return enrollmentsQuery;
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('AdminCoursesPage', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders the recent enrollments as a table with row content', async () => {
    vi.doMock('@/lib/auth', () => ({
      requireAdmin: vi.fn().mockResolvedValue({
        shopId: 'shop-1',
        shopSlug: 'navaja-centro',
      }),
    }));
    vi.doMock('@/lib/supabase/server', () => ({
      createSupabaseServerClient: vi.fn().mockResolvedValue(
        createSupabaseServerMock({
          courses: [
            {
              id: 'course-1',
              title: 'Fade Pro',
              description: 'Tecnicas avanzadas',
              level: 'Intermedio',
              price_cents: 5000,
              duration_hours: 6,
              image_url: null,
              is_active: true,
            },
          ],
          sessions: [
            {
              id: 'session-1',
              course_id: 'course-1',
              start_at: '2026-03-10T14:00:00.000Z',
              capacity: 12,
              location: 'Centro',
              status: 'scheduled',
            },
          ],
          enrollments: [
            {
              id: 'enrollment-1',
              session_id: 'session-1',
              name: 'Valentina Gomez',
              phone: '+59899111222',
              email: 'valentina@example.com',
              status: 'pending',
              created_at: '2026-03-05T12:00:00.000Z',
              course_sessions: { course_id: 'course-1' },
            },
          ],
        }),
      ),
    }));
    vi.doMock('@/components/admin/course-form', () => ({
      AdminCourseForm: () => <div data-testid="admin-course-form" />,
    }));
    vi.doMock('@/components/admin/course-session-form', () => ({
      AdminCourseSessionForm: () => <div data-testid="admin-course-session-form" />,
    }));

    const { default: CoursesAdminPage } = await import('@/app/admin/courses/page');
    render(await CoursesAdminPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText('Inscripciones recientes')).toBeInTheDocument();
    expect(screen.getByLabelText('Tabla de inscripciones de cursos')).toBeInTheDocument();
    expect(screen.getByText('ALUMNO')).toBeInTheDocument();
    expect(screen.getByText('CONTACTO')).toBeInTheDocument();
    expect(screen.getByText('ESTADO')).toBeInTheDocument();
    expect(screen.getByText('SESION')).toBeInTheDocument();
    expect(screen.getByText('INSCRIPCION')).toBeInTheDocument();
    expect(screen.getByText('Valentina Gomez')).toBeInTheDocument();
    expect(screen.getByText('valentina@example.com')).toBeInTheDocument();
    expect(screen.getByText('+59899111222')).toBeInTheDocument();
    expect(screen.getAllByText('Fade Pro').length).toBeGreaterThan(0);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('renders the empty content when there are no enrollments', async () => {
    vi.doMock('@/lib/auth', () => ({
      requireAdmin: vi.fn().mockResolvedValue({
        shopId: 'shop-1',
        shopSlug: 'navaja-centro',
      }),
    }));
    vi.doMock('@/lib/supabase/server', () => ({
      createSupabaseServerClient: vi.fn().mockResolvedValue(
        createSupabaseServerMock({
          courses: [],
          sessions: [],
          enrollments: [],
        }),
      ),
    }));
    vi.doMock('@/components/admin/course-form', () => ({
      AdminCourseForm: () => <div data-testid="admin-course-form" />,
    }));
    vi.doMock('@/components/admin/course-session-form', () => ({
      AdminCourseSessionForm: () => <div data-testid="admin-course-session-form" />,
    }));

    const { default: CoursesAdminPage } = await import('@/app/admin/courses/page');
    render(await CoursesAdminPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText('Todavia no hay inscripciones.')).toBeInTheDocument();
  });
});
