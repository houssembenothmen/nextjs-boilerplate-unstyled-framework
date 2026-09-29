'use client'

import * as React from 'react'
import { getCountries } from '@/lib/api/resources/countries'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Autocomplete,
  type AutocompleteOption,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  CheckboxGroup,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DatePicker,
  DatePickerContent,
  DatePickerTrigger,
  DateRangePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
  Form,
  FormField,
  FormLabel,
  FormMessage,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  IconButton,
  Input,
  NumberInput,
  PasswordInput,
  PasswordInputField,
  PasswordInputToggle,
  Pagination,
  PinInput,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  ProgressIndicator,
  RadioGroup,
  RadioGroupItem,
  Rating,
  ScrollArea,
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Tree,
  TreeItem,
  toast,
  useForm,
} from '@/components/ui'

function ShowcaseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section data-section>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function ComponentsShowcase() {
  const [loading, setLoading] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState('pro')
  const [toggleOn, setToggleOn] = React.useState(true)
  const [ratingValue, setRatingValue] = React.useState(4)
  const [rangeValue, setRangeValue] = React.useState(68)
  const [date, setDate] = React.useState<Date | null>(null)
  const [range, setRange] = React.useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  })
  const [favoriteCountries, setFavoriteCountries] = React.useState<AutocompleteOption[]>([])

  React.useEffect(() => {
    const now = new Date()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(now)
    setRange({ from: now, to: null })
  }, [])

  const searchCountries = React.useCallback(async (query: string) => getCountries(query), [])

  const form = useForm({
    defaultValues: { email: '', notes: '', plan: 'pro' },
    validate: (v): Record<string, string> => {
      if (!v.email.includes('@')) return { email: 'Enter a valid email' }
      return {}
    },
    onSubmit: (v) => {
      toast.success(`Subscribed ${v.email} on ${v.plan}`)
    },
  })

  return (
    <section data-section>
      <h2>Component showcase</h2>
      <p data-note>
        This preview walks through the main parts of the project&apos;s UI library: actions,
        forms, overlays, navigation, and feedback patterns.
      </p>

      <ShowcaseSection title="Actions">
        <div data-row>
          <Button data-variant="primary">Primary</Button>
          <Button data-variant="outline">Outline</Button>
          <Button data-variant="ghost">Ghost</Button>
          <Button
            data-variant="primary"
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1000)
            }}
          >
            Click to load
          </Button>
        </div>

        <div data-row>
          <ButtonGroup>
            <Button data-variant="outline">Save</Button>
            <Button data-variant="outline">Publish</Button>
            <Button data-variant="outline">Share</Button>
          </ButtonGroup>

          <ToggleGroup type="single" value={selectedPlan} onValueChange={setSelectedPlan}>
            <ToggleGroupItem value="starter">Starter</ToggleGroupItem>
            <ToggleGroupItem value="pro">Pro</ToggleGroupItem>
            <ToggleGroupItem value="team">Team</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div data-row>
          <Toggle aria-label="Notifications" pressed={toggleOn} onClick={() => setToggleOn((v) => !v)}>
            {toggleOn ? 'Enabled' : 'Disabled'}
          </Toggle>
          <IconButton aria-label="Add item">＋</IconButton>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Forms">
        <Form onSubmit={form.handleSubmit} data-stack data-narrow>
          <FormField
            name="email"
            error={form.getFieldMeta('email').invalid ? form.errors.email : undefined}
          >
            <FormLabel>Email</FormLabel>
            <Input type="email" placeholder="you@example.com" {...form.register('email')} />
            <FormMessage />
          </FormField>

          <FormField name="plan">
            <FormLabel>Plan</FormLabel>
            <Select value={form.values.plan} onValueChange={(value) => form.setValue('plan', value)}>
              <SelectTrigger placeholder="Choose a plan" />
              <SelectContent data-listbox>
                <SelectOption value="starter">Starter</SelectOption>
                <SelectOption value="pro">Pro</SelectOption>
                <SelectOption value="team">Team</SelectOption>
              </SelectContent>
            </Select>
          </FormField>

          <FormField name="notes">
            <FormLabel>Notes</FormLabel>
            <Textarea placeholder="Tell us about your goals" {...form.register('notes')} />
          </FormField>

          <div data-row>
            <NumberInput value={42} aria-label="Amount" />
            <PasswordInput>
              <PasswordInputField aria-label="Password" placeholder="Password" />
              <PasswordInputToggle />
            </PasswordInput>
          </div>

          <div data-row>
            <PinInput length={4} aria-label="One-time code" />
            <Switch checked={toggleOn} onCheckedChange={setToggleOn} />
          </div>

          <FormField name="favoriteCountries">
            <FormLabel>Favorite countries</FormLabel>
            <Autocomplete
              multiple
              loadOptions={searchCountries}
              minChars={0}
              value={favoriteCountries}
              onChange={(next) => {
                setFavoriteCountries(Array.isArray(next) ? next : next ? [next] : [])
              }}
              clearable
              maxVisibleChips={5}
              placeholder="Search countries"
            />
          </FormField>

          <div data-stack>
            <CheckboxGroup value={['updates']} onValueChange={(value) => console.log(value)}>
              <Checkbox value="updates">Email updates</Checkbox>
              <Checkbox value="product">Product news</Checkbox>
            </CheckboxGroup>

            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              <RadioGroupItem value="starter">Starter</RadioGroupItem>
              <RadioGroupItem value="pro">Pro</RadioGroupItem>
              <RadioGroupItem value="team">Team</RadioGroupItem>
            </RadioGroup>
          </div>

          <div data-stack>
            <label>Range</label>
            <Slider value={rangeValue} max={100} onValueChange={setRangeValue} />
          </div>

          <div data-row>
            <Rating value={ratingValue} onValueChange={setRatingValue} />
          </div>

          <Button type="submit" data-variant="primary">Subscribe</Button>
        </Form>
      </ShowcaseSection>

      <ShowcaseSection title="Data display">
        <div data-row>
          <Badge variant="default">Stable</Badge>
          <Badge variant="success">Live</Badge>
          <Badge variant="warning">Beta</Badge>
          <Badge variant="danger">Needs review</Badge>
        </div>

        <div data-row>
          <Card>
            <h3>Team pulse</h3>
            <p data-note>Last release shipped in 3 days.</p>
          </Card>
          <Card>
            <Avatar>
              <AvatarImage src="https://placehold.co/64x64" alt="Ada" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Marketing site</TableCell>
              <TableCell>Ready</TableCell>
              <TableCell>Ada</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Analytics</TableCell>
              <TableCell>In review</TableCell>
              <TableCell>Lin</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Accordion type="single" defaultValue="details">
          <AccordionItem value="details">
            <AccordionTrigger>Project details</AccordionTrigger>
            <AccordionContent>
              Accessible, headless primitives for custom layouts and styling systems.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="setup">
            <AccordionTrigger>Setup notes</AccordionTrigger>
            <AccordionContent>
              Use any CSS strategy you prefer: plain CSS, Tailwind, or your own design tokens.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Tree aria-label="Project tree" defaultExpanded={['src']}>
          <TreeItem value="src" label="src">
            <TreeItem value="app" label="app" />
            <TreeItem value="components" label="components" />
            <TreeItem value="lib" label="lib" />
          </TreeItem>
        </Tree>

        <ScrollArea style={{ height: 120, border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
          <p data-note>
            Scroll areas let long content stay usable without fighting layout overflow.
          </p>
          <p data-note>Item one</p>
          <p data-note>Item two</p>
          <p data-note>Item three</p>
          <p data-note>Item four</p>
          <p data-note>Item five</p>
        </ScrollArea>
        <Separator />
      </ShowcaseSection>

      <ShowcaseSection title="Feedback">
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>New components are available in the preview environment.</AlertDescription>
        </Alert>

        <div data-stack>
          <Progress value={68} />
          <ProgressIndicator style={{ width: '68%' }} />
        </div>

        <div data-row>
          <Skeleton style={{ width: 120, height: 18 }} />
          <Skeleton style={{ width: 90, height: 18 }} />
          <Spinner />
        </div>

        <EmptyState>
          <EmptyStateTitle>No items yet</EmptyStateTitle>
          <EmptyStateDescription>Create your first item to get started.</EmptyStateDescription>
          <EmptyStateActions>
            <Button data-variant="primary">Create item</Button>
          </EmptyStateActions>
        </EmptyState>
      </ShowcaseSection>

      <ShowcaseSection title="Navigation">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Library</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Components</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Accessible, composable primitives with state and style hooks.</TabsContent>
          <TabsContent value="api">Each component exposes semantic data attributes for custom styling.</TabsContent>
          <TabsContent value="examples">Use them as building blocks for dashboards, forms, and product surfaces.</TabsContent>
        </Tabs>

        <Pagination page={1} pageCount={5} aria-label="Example pages">
          <PaginationPrevious aria-label="Previous page" />
          <PaginationItems />
          <PaginationNext aria-label="Next page" />
        </Pagination>
      </ShowcaseSection>

      <ShowcaseSection title="Overlays and menus">
        <div data-row>
          <Dialog>
            <DialogTrigger asChild>
              <Button data-variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent data-dialog>
              <DialogTitle>Delete item?</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
              <div data-row>
                <DialogClose asChild>
                  <Button data-variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button data-variant="danger">Delete</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          <Popover>
            <PopoverTrigger>Open popover</PopoverTrigger>
            <PopoverContent>
              <p data-note>Messages and contextual actions live here.</p>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button data-variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Helpful context</TooltipContent>
          </Tooltip>
        </div>

        <div data-row>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button data-variant="outline">Hover card</Button>
            </HoverCardTrigger>
            <HoverCardContent>Rich preview content can live here.</HoverCardContent>
          </HoverCard>

          <DropdownMenu>
            <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>View project</DropdownMenuItem>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ShowcaseSection>

      <ShowcaseSection title="Date and layout">
        <div data-row>
          <DatePicker value={date} onValueChange={setDate}>
            <DatePickerTrigger placeholder="Pick a date" />
            <DatePickerContent />
          </DatePicker>

          <DateRangePicker value={range} onValueChange={setRange}>
            <DatePickerTrigger placeholder="Select range" />
            <DatePickerContent />
          </DateRangePicker>
        </div>

        <SidebarProvider open={true} onOpenChange={() => undefined}>
          <SidebarTrigger aria-label="Toggle sidebar">Toggle sidebar</SidebarTrigger>
          <Sidebar>
            <SidebarHeader>Workspace</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton active>Overview</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Activity</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>v1.0.0</SidebarFooter>
          </Sidebar>
        </SidebarProvider>
      </ShowcaseSection>
    </section>
  )
}
