import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schemas
const reportTemplateCreateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters').max(100, 'Template name cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description cannot exceed 500 characters'),
  category: z.enum(['progress_report', 'final_report']),
  type: z.enum(['form', 'report']),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  fields: z.array(z.object({
    name: z.string().min(1, 'Field name is required').max(50, 'Field name cannot exceed 50 characters'),
    label: z.string().min(1, 'Field label is required').max(100, 'Field label cannot exceed 100 characters'),
    type: z.enum(['text', 'textarea', 'number', 'date', 'select', 'checkbox']),
    isRequired: z.boolean().default(false),
    order: z.number().min(0).default(0),
    isVisible: z.boolean().default(true),
    isEditable: z.boolean().default(true)
  })).min(1, 'At least one field is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z').default('1.0.0'),
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters')).optional().default([]),
  createdBy: z.string().uuid('Invalid creator ID')
})

const reportTemplateQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  category: z.enum(['progress_report', 'final_report']).optional(),
  type: z.enum(['form', 'report']).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  isPublic: z.string().transform(val => val === 'true').optional(),
  isDefault: z.string().transform(val => val === 'true').optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'version']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
})

// Mock template data since we don't have a templates table in the schema
const mockTemplates = [
  {
    id: '1',
    name: 'Standard Progress Report',
    description: 'Standard template for progress reports',
    category: 'progress_report',
    type: 'report',
    isActive: true,
    isPublic: true,
    isDefault: true,
    fields: [
      { name: 'progress', label: 'Progress Description', type: 'textarea', isRequired: true, order: 1, isVisible: true, isEditable: true },
      { name: 'challenges', label: 'Challenges', type: 'textarea', isRequired: false, order: 2, isVisible: true, isEditable: true },
      { name: 'nextSteps', label: 'Next Steps', type: 'textarea', isRequired: false, order: 3, isVisible: true, isEditable: true }
    ],
    version: '1.0.0',
    tags: ['progress', 'standard'],
    createdBy: 'system',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Final Report Template',
    description: 'Standard template for final reports',
    category: 'final_report',
    type: 'report',
    isActive: true,
    isPublic: true,
    isDefault: true,
    fields: [
      { name: 'summary', label: 'Treatment Summary', type: 'textarea', isRequired: true, order: 1, isVisible: true, isEditable: true },
      { name: 'outcomes', label: 'Treatment Outcomes', type: 'textarea', isRequired: true, order: 2, isVisible: true, isEditable: true },
      { name: 'recommendations', label: 'Recommendations', type: 'textarea', isRequired: false, order: 3, isVisible: true, isEditable: true }
    ],
    version: '1.0.0',
    tags: ['final', 'summary'],
    createdBy: 'system',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

// GET /api/report-templates - Get report templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = reportTemplateQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      type: searchParams.get('type'),
      isActive: searchParams.get('isActive'),
      isPublic: searchParams.get('isPublic'),
      isDefault: searchParams.get('isDefault'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, category, type, isActive, isPublic, isDefault, search, sortBy, sortOrder } = validation.data

    // Filter templates
    let filteredTemplates = mockTemplates.filter(template => {
      if (category && template.category !== category) return false
      if (type && template.type !== type) return false
      if (isActive !== undefined && template.isActive !== isActive) return false
      if (isPublic !== undefined && template.isPublic !== isPublic) return false
      if (isDefault !== undefined && template.isDefault !== isDefault) return false
      if (search && !template.name.toLowerCase().includes(search.toLowerCase()) && 
          !template.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    // Sort templates
    filteredTemplates.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a]
      let bValue: any = b[sortBy as keyof typeof b]
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    // Calculate pagination
    const totalCount = filteredTemplates.length
    const skip = (page - 1) * limit
    const paginatedTemplates = filteredTemplates.slice(skip, skip + limit)

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        templates: paginatedTemplates,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          category,
          type,
          isActive,
          isPublic,
          isDefault,
          search,
          sortBy,
          sortOrder
        }
      }
    })

  } catch (error) {
    console.error('Error fetching report templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/report-templates - Create report template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = reportTemplateCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, description, category, type, isActive, isPublic, isDefault, fields, version, tags, createdBy } = validation.data

    // Create new template (in a real implementation, this would be saved to database)
    const newTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      category,
      type,
      isActive,
      isPublic,
      isDefault,
      fields,
      version,
      tags,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to mock templates (in real implementation, save to database)
    mockTemplates.push(newTemplate)

    return NextResponse.json({
      success: true,
      message: 'Report template created successfully',
      data: {
        template: newTemplate
      }
    })

  } catch (error) {
    console.error('Error creating report template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}