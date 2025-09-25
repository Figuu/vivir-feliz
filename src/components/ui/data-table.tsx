"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Download, Eye, Search, Filter, X, Users, UserCheck, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface FilterOption {
  label: string
  value: string
  count?: number
}

interface ColumnFilter {
  id: string
  title: string
  options: FilterOption[]
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  title?: string
  description?: string
  searchPlaceholder?: string
  onExport?: () => void
  onBulkAction?: (action: string, selectedRows: TData[]) => void
  filters?: ColumnFilter[]
  enableDateFilter?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  title,
  description,
  searchPlaceholder = "Search...",
  onExport,
  onBulkAction,
  filters = [],
  enableDateFilter = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateRange, setDateRange] = React.useState<{from?: Date; to?: Date}>({})
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)

  // Helper functions for filters
  const handleFilterChange = (filterId: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: values
    }))
    
    if (values.length > 0) {
      setColumnFilters(prev => [
        ...prev.filter(filter => filter.id !== filterId),
        { id: filterId, value: values }
      ])
    } else {
      setColumnFilters(prev => prev.filter(filter => filter.id !== filterId))
    }
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    setColumnFilters([])
    setGlobalFilter("")
    setDateRange({})
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (globalFilter) count++
    if (dateRange.from || dateRange.to) count++
    count += Object.values(activeFilters).filter(values => values.length > 0).length
    return count
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {title && (
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-[250px]" />
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-[100px]" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-4 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
          {selectedRows.length > 0 && (
            <Badge variant="secondary">
              {selectedRows.length} selected
            </Badge>
          )}
        </div>
      )}
      
      {/* Main Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
          
          {/* Filter Button */}
          {(filters.length > 0 || enableDateFilter) && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="border-dashed">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Filters</h4>
                    {getActiveFilterCount() > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        Clear all
                      </Button>
                    )}
                  </div>
                  
                  {/* Column Filters */}
                  {filters.map((filter) => (
                    <div key={filter.id} className="space-y-2">
                      <Label className="text-xs font-medium">{filter.title}</Label>
                      <div className="space-y-1">
                        {filter.options.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${filter.id}-${option.value}`}
                              checked={activeFilters[filter.id]?.includes(option.value) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = activeFilters[filter.id] || []
                                if (checked) {
                                  handleFilterChange(filter.id, [...currentValues, option.value])
                                } else {
                                  handleFilterChange(filter.id, currentValues.filter(v => v !== option.value))
                                }
                              }}
                            />
                            <Label
                              htmlFor={`${filter.id}-${option.value}`}
                              className="text-xs flex-1 cursor-pointer"
                            >
                              {option.label}
                              {option.count !== undefined && (
                                <span className="text-muted-foreground ml-auto">({option.count})</span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Date Filter */}
                  {enableDateFilter && (
                    <>
                      {filters.length > 0 && <Separator />}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Date Range</Label>
                        <div className="space-y-2">
                          <Input
                            type="date"
                            placeholder="From"
                            value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                            onChange={(e) => setDateRange(prev => ({ 
                              ...prev, 
                              from: e.target.value ? new Date(e.target.value) : undefined 
                            }))}
                            className="text-xs"
                          />
                          <Input
                            type="date"
                            placeholder="To"
                            value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                            onChange={(e) => setDateRange(prev => ({ 
                              ...prev, 
                              to: e.target.value ? new Date(e.target.value) : undefined 
                            }))}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Clear Filters */}
          {getActiveFilterCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear ({getActiveFilterCount()})
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedRows.length > 0 && onBulkAction && (
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Bulk Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onBulkAction("role-change", selectedRows)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Change Roles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction("export", selectedRows)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => onBulkAction("delete", selectedRows)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Columns
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </p>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to create a sortable header
export function SortableHeader({ column, children }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => string | false }; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-4 h-8 data-[state=open]:bg-accent"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

// Helper function to create a selectable checkbox column
export function createSelectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

// Export types for external use
export type { FilterOption, ColumnFilter }