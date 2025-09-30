import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const reportTemplateCreateSchema = z.object({
  // Basic Information
  name: z.string()
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name cannot exceed 100 characters')
    .transform(val => val.trim()),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters')
    .transform(val => val.trim()),
  
  category: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'assessment', 'evaluation', 'custom']),
  
  type: z.enum(['form', 'report', 'assessment', 'evaluation', 'summary']),
  
  // Template Configuration
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  
  // Fields Configuration
  fields: z.array(z.object({
    id: z.string().optional(),
    name: z.string()
      .min(1, 'Field name is required')
      .max(50, 'Field name cannot exceed 50 characters')
      .transform(val => val.trim()),
    
    label: z.string()
      .min(1, 'Field label is required')
      .max(100, 'Field label cannot exceed 100 characters')
      .transform(val => val.trim()),
    
    type: z.enum(['text', 'textarea', 'number', 'date', 'time', 'select', 'checkbox', 'radio', 'file', 'signature']),
    
    placeholder: z.string()
      .max(200, 'Placeholder cannot exceed 200 characters')
      .optional()
      .transform(val => val?.trim()),
    
    helpText: z.string()
      .max(500, 'Help text cannot exceed 500 characters')
      .optional()
      .transform(val => val?.trim()),
    
    // Validation Rules
    isRequired: z.boolean().default(false),
    
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),
    
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    
    pattern: z.string()
      .max(200, 'Pattern cannot exceed 200 characters')
      .optional(),
    
    // Options for select/radio fields
    options: z.array(z.object({
      value: z.string().max(100, 'Option value cannot exceed 100 characters'),
      label: z.string().max(100, 'Option label cannot exceed 100 characters'),
      isDefault: z.boolean().default(false)
    })).optional(),
    
    // Field Configuration
    order: z.number().min(0).default(0),
    
    isVisible: z.boolean().default(true),
    
    isEditable: z.boolean().default(true),
    
    // Conditional Logic
    showConditions: z.array(z.object({
      field: z.string().max(50, 'Condition field cannot exceed 50 characters'),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']),
      value: z.string().max(200, 'Condition value cannot exceed 200 characters')
    })).optional(),
    
    // File Upload Configuration
    allowedFileTypes: z.array(z.string().max(20, 'File type cannot exceed 20 characters')).optional(),
    maxFileSize: z.number().min(1).optional(), // in MB
    
    // Signature Configuration
    signatureRequired: z.boolean().default(false),
    
    // Default Values
    defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional()
  })).min(1, 'At least one field is required'),
  
  // Template Metadata
  version: z.string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z')
    .default('1.0.0'),
  
  tags: z.array(z.string().max(30, 'Tag cannot exceed 30 characters')).optional().default([]),
  
  // Access Control
  createdBy: z.string().uuid('Invalid creator ID'),
  
  // Template Settings
  settings: z.object({
    allowMultipleSubmissions: z.boolean().default(false),
    requireApproval: z.boolean().default(false),
    autoSave: z.boolean().default(true),
    showProgress: z.boolean().default(true),
    allowDraft: z.boolean().default(true),
    maxSubmissions: z.number().min(1).optional(),
    expirationDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiration date must be in YYYY-MM-DD format')
      .transform(val => new Date(val))
      .optional()
  }).optional().default({})
})

const reportTemplateUpdateSchema = reportTemplateCreateSchema.partial()

const reportTemplateQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  category: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'assessment', 'evaluation', 'custom']).optional(),
  type: z.enum(['form', 'report', 'assessment', 'evaluation', 'summary']).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  isPublic: z.string().transform(val => val === 'true').optional(),
  isDefault: z.string().transform(val => val === 'true').optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  tags: z.string().max(100, 'Tags cannot exceed 100 characters').optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'version', 'category']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/report-templates - Get report templates with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = reportTemplateQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      type: searchParams.get('type'),
      isActive: searchParams.get('isActive'),
      isPublic: searchParams.get('isPublic'),
      isDefault: searchParams.get('isDefault'),
      search: searchParams.get('search'),
      tags: searchParams.get('tags'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, category, type, isActive, isPublic, isDefault, search, tags, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (category) {
      whereClause.category = category
    }
    
    if (type) {
      whereClause.type = type
    }
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive
    }
    
    if (isPublic !== undefined) {
      whereClause.isPublic = isPublic
    }
    
    if (isDefault !== undefined) {
      whereClause.isDefault = isDefault
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim())
      whereClause.tags = { hasSome: tagArray }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get report templates with related data
    const [templates, totalCount] = await Promise.all([
      db.reportTemplate.findMany({
        where: whereClause,
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              fields: true,
              submissions: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.reportTemplate.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        templates: templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          type: template.type,
          isActive: template.isActive,
          isPublic: template.isPublic,
          isDefault: template.isDefault,
          version: template.version,
          tags: template.tags,
          fields: template.fields,
          settings: template.settings,
          createdBy: template.createdBy,
          createdByUser: template.createdByUser,
          stats: {
            totalFields: template._count.fields,
            totalSubmissions: template._count.submissions
          },
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        })),
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
          tags,
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

// POST /api/report-templates - Create a new report template
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

    const validatedData = validation.data

    // Check if creator exists
    const creator = await db.user.findUnique({
      where: { id: validatedData.createdBy }
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Validate field configurations
    for (const field of validatedData.fields) {
      // Validate field name uniqueness within template
      const duplicateNames = validatedData.fields.filter(f => f.name === field.name)
      if (duplicateNames.length > 1) {
        return NextResponse.json(
          { error: `Duplicate field name: ${field.name}` },
          { status: 400 }
        )
      }

      // Validate field type specific rules
      if (field.type === 'select' || field.type === 'radio') {
        if (!field.options || field.options.length === 0) {
          return NextResponse.json(
            { error: `Field "${field.name}" of type ${field.type} requires options` },
            { status: 400 }
          )
        }
        
        // Validate option values are unique
        const optionValues = field.options.map(opt => opt.value)
        const uniqueValues = new Set(optionValues)
        if (optionValues.length !== uniqueValues.size) {
          return NextResponse.json(
            { error: `Field "${field.name}" has duplicate option values` },
            { status: 400 }
          )
        }
      }

      // Validate numeric field constraints
      if (field.type === 'number') {
        if (field.minValue !== undefined && field.maxValue !== undefined) {
          if (field.minValue >= field.maxValue) {
            return NextResponse.json(
              { error: `Field "${field.name}": minValue must be less than maxValue` },
              { status: 400 }
            )
          }
        }
      }

      // Validate text field constraints
      if (field.type === 'text' || field.type === 'textarea') {
        if (field.minLength !== undefined && field.maxLength !== undefined) {
          if (field.minLength > field.maxLength) {
            return NextResponse.json(
              { error: `Field "${field.name}": minLength must be less than or equal to maxLength` },
              { status: 400 }
            )
          }
        }
      }

      // Validate file upload constraints
      if (field.type === 'file') {
        if (!field.allowedFileTypes || field.allowedFileTypes.length === 0) {
          return NextResponse.json(
            { error: `Field "${field.name}" of type file requires allowedFileTypes` },
            { status: 400 }
          )
        }
        
        if (!field.maxFileSize || field.maxFileSize <= 0) {
          return NextResponse.json(
            { error: `Field "${field.name}" of type file requires maxFileSize` },
            { status: 400 }
          )
        }
      }

      // Validate conditional logic
      if (field.showConditions) {
        for (const condition of field.showConditions) {
          const referencedField = validatedData.fields.find(f => f.name === condition.field)
          if (!referencedField) {
            return NextResponse.json(
              { error: `Field "${field.name}" references non-existent field "${condition.field}" in showConditions` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Create report template with transaction
    const result = await db.$transaction(async (tx) => {
      // Create report template
      const template = await tx.reportTemplate.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          category: validatedData.category,
          type: validatedData.type,
          isActive: validatedData.isActive,
          isPublic: validatedData.isPublic,
          isDefault: validatedData.isDefault,
          version: validatedData.version,
          tags: validatedData.tags,
          settings: validatedData.settings,
          createdBy: validatedData.createdBy
        }
      })

      // Create template fields
      for (const fieldData of validatedData.fields) {
        await tx.reportTemplateField.create({
          data: {
            templateId: template.id,
            name: fieldData.name,
            label: fieldData.label,
            type: fieldData.type,
            placeholder: fieldData.placeholder,
            helpText: fieldData.helpText,
            isRequired: fieldData.isRequired,
            minLength: fieldData.minLength,
            maxLength: fieldData.maxLength,
            minValue: fieldData.minValue,
            maxValue: fieldData.maxValue,
            pattern: fieldData.pattern,
            options: fieldData.options,
            order: fieldData.order,
            isVisible: fieldData.isVisible,
            isEditable: fieldData.isEditable,
            showConditions: fieldData.showConditions,
            allowedFileTypes: fieldData.allowedFileTypes,
            maxFileSize: fieldData.maxFileSize,
            signatureRequired: fieldData.signatureRequired,
            defaultValue: fieldData.defaultValue
          }
        })
      }

      return template
    })

    // Return created template with related data
    const createdTemplate = await db.reportTemplate.findUnique({
      where: { id: result.id },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fields: true,
        _count: {
          select: {
            fields: true,
            submissions: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Report template created successfully',
      data: createdTemplate
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating report template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
