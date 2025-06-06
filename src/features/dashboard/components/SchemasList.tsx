'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DidMethod, SchemaTypeValue } from '@/common/enums'
import React, { useEffect, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ToolTipDataForSchema } from './TooltipData'
import { dateConversion } from '@/utils/DateConversion'
import { getAllSchemasByOrgId } from '@/app/api/schema'
import { pathRoutes } from '@/config/pathRoutes'
import { useAppSelector } from '@/lib/hooks'
import { useRouter } from 'next/navigation'

type Schema = {
  id: string
  name: string
  version: string
  createDateTime: string
  organizationName: string
  schemaLedgerId: string
  issuerId?: string
}

const SchemasList = ({
  walletExists,
}: {
  walletExists: boolean
}): React.JSX.Element => {
  const [loading, setLoading] = useState(true)
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [schemaTypeValues, setSchemaTypeValues] = useState<SchemaTypeValue>()
  const currentPage = 1
  const pageSize = 10
  const [showTooltip, setShowTooltip] = useState(false)
  const orgId = useAppSelector((state) => state.organization.orgId)
  const router = useRouter()

  const fetchSchemas = async (): Promise<void> => {
    setLoading(true)

    try {
      const response = await getAllSchemasByOrgId(
        { search: '', itemPerPage: pageSize, page: currentPage },
        orgId as string,
      )

      if (
        response &&
        typeof response !== 'string' &&
        response.data?.data?.data
      ) {
        setSchemas(response.data.data.data)

        const did = response.data.data.data[0]?.issuerId
        if (did) {
          if (did.includes(DidMethod.INDY)) {
            setSchemaTypeValues(SchemaTypeValue.INDY)
          } else if (did.includes(DidMethod.POLYGON)) {
            setSchemaTypeValues(SchemaTypeValue.POLYGON)
          } else if (
            did.includes(DidMethod.KEY) ||
            did.includes(DidMethod.WEB)
          ) {
            setSchemaTypeValues(SchemaTypeValue.NO_LEDGER)
          }
        }
      } else {
        setSchemas([])
      }
    } catch (error) {
      console.error('Error fetching schemas:', error)
      setSchemas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) {
      fetchSchemas()
    }
  }, [orgId])

  const previewSchemas = schemas.slice(0, 3)

  const handleClickSchema = (schemaId: string): void => {
    const encodedSchemaId = encodeURIComponent(schemaId)
    router.push(`/organizations/schemas/${encodedSchemaId}`)
  }

  const renderSchema = (schema: Schema, index: number): React.JSX.Element => {
    const isIndySchema = schemaTypeValues === SchemaTypeValue.INDY

    return (
      <button
        key={index}
        type="button"
        onClick={() =>
          (isIndySchema
            ? handleClickSchema(schema.schemaLedgerId)
            : router.push(pathRoutes.organizations.schemas))
        }
        aria-disabled={!isIndySchema}
        className={
          'border-border/50 hover:bg-muted/50 flex w-full items-center justify-between gap-5 rounded-xl border p-3 text-left shadow-xl transition-transform duration-300'
        }
      >
        <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M7 9H18.75M7 12H18.75M7 15H13M4.5 19.5H19.5C20.0967 19.5 20.669 19.2629 21.091 18.841C21.5129 18.419 21.75 17.8467 21.75 17.25V6.75C21.75 6.15326 21.5129 5.58097 21.091 5.15901C20.669 4.73705 20.0967 4.5 19.5 4.5H4.5C3.90326 4.5 3.33097 4.73705 2.90901 5.15901C2.48705 5.58097 2.25 6.15326 2.25 6.75V17.25C2.25 17.8467 2.48705 18.419 2.90901 18.841C3.33097 19.2629 3.90326 19.5 4.5 19.5Z"
              stroke="#6B7280"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1 space-y-1 truncate text-sm">
          <p className="font-semibold">{schema.name}</p>
          <p className="text-muted-foreground">Version: {schema.version}</p>
          <p className="text-muted-foreground">
            Created: {dateConversion(schema.createDateTime)}
          </p>
          <p className="text-muted-foreground">
            Organization: {schema.organizationName}
          </p>
        </div>
      </button>
    )
  }

  const handleCreateSchemaClick = (): void => {
    if (!orgId || !walletExists) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 3000)
    } else {
      router.push('/organizations/schemas/create')
    }
  }

  return (
    <Card className="border-border relative flex h-full w-full flex-col overflow-hidden rounded-xl border py-4 shadow-xl transition-transform duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-xl">Schemas</CardTitle>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  <ToolTipDataForSchema />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge>{schemas.length}</Badge>
          </div>

          <Tooltip open={showTooltip}>
            <TooltipTrigger asChild>
              <Button onClick={handleCreateSchemaClick}>
                <Plus className="h-4 w-4" /> New Schema
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Create an organization and a wallet first.
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>Manage your data schemas</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-4 w-[300px]" />
              </div>
            </div>
          ))
        ) : previewSchemas.length > 0 ? (
          previewSchemas.map(renderSchema)
        ) : (
          <div className="flex h-40 items-center justify-center">
            <p className="text-muted-foreground text-sm">No schemas found.</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto justify-end pt-2">
        <Link href="/organizations/schemas">View all</Link>
      </CardFooter>
    </Card>
  )
}

export default SchemasList
