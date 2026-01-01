import { useState, useDeferredValue } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Modal, Button, Badge, Input, Loading, Toggle, Card, Grid, Dropdown, Checkbox, Divider } from 'asterui'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import type { Media as MediaType, PaginatedResponse } from '../types'

const { Row, Col } = Grid

// Map ISO language codes to English names
const languageNames: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'zh': 'Chinese',
  'hi': 'Hindi',
  'ar': 'Arabic',
  'bn': 'Bengali',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'fr': 'French',
  'pa': 'Punjabi',
  'ja': 'Japanese',
  'ko': 'Korean',
  'vi': 'Vietnamese',
  'ta': 'Tamil',
  'it': 'Italian',
  'tl': 'Tagalog',
  'fa': 'Persian',
  'ro': 'Romanian',
  'el': 'Greek',
  'ht': 'Haitian Creole',
  'ilo': 'Ilocano',
  'ff': 'Fulah',
  'ur': 'Urdu',
  'he': 'Hebrew',
  'de': 'German',
  'id': 'Indonesian',
  'mr': 'Marathi',
  'sw': 'Swahili',
  'te': 'Telugu',
  'tr': 'Turkish',
}

export default function Media() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [trackingModalMediaId, setTrackingModalMediaId] = useState<number | null>(null)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(100)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { t } = useTranslation()

  // Defer search to avoid blocking input
  const search = useDeferredValue(searchInput)

  const { data, isLoading } = useQuery<PaginatedResponse<MediaType>>({
    queryKey: ['media', page, search, selectedLanguages],
    queryFn: () => api.media.list({
      page,
      limit: 20,
      search,
      languages: selectedLanguages.length > 0 ? selectedLanguages.join(',') : undefined,
      isManualFilter: selectedLanguages.length > 0,
      sortByPopularity: true,
    }),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.media.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
  })

  const toggleVisibleMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: number; isVisible: boolean }) =>
      api.media.update(id, { isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
  })

  const inventoryAdjustMutation = useMutation({
    mutationFn: ({ id, bundleSize, quantity }: { id: number; bundleSize: number; quantity: number }) =>
      api.inventory.adjust(id, bundleSize, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
  })

  const handleInventoryAdjust = (id: number, bundleSize: number, newQuantity: number) => {
    if (newQuantity < 0) return
    inventoryAdjustMutation.mutate({ id, bundleSize, quantity: newQuantity })
  }

  const enableTrackingMutation = useMutation({
    mutationFn: ({ id, trackInventory, bundleSizes, lowStockThreshold }: { id: number; trackInventory: boolean; bundleSizes?: number[]; lowStockThreshold?: number }) =>
      api.inventory.enableTracking(id, trackInventory, bundleSizes, lowStockThreshold),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      setTrackingModalMediaId(null)
    },
  })

  const handleEnableTracking = (item: MediaType) => {
    setLowStockThreshold(100)
    setTrackingModalMediaId(item.id)
  }

  const handleConfirmEnableTracking = (item: MediaType) => {
    enableTrackingMutation.mutate({
      id: item.id,
      trackInventory: true,
      bundleSizes: item.bundleSizes || undefined,
      lowStockThreshold,
    })
  }

  const handleDisableTracking = (id: number) => {
    Modal.confirm({
      title: t('media.disableTracking'),
      content: t('media.confirmDisableTracking'),
      okText: t('media.disableTracking'),
      cancelText: t('common.cancel'),
      type: 'error',
      onOk: () => {
        enableTrackingMutation.mutate({ id, trackInventory: false })
      },
    })
  }

  const canEditMedia = (item: MediaType) => {
    if (user?.role === 'super_admin' || user?.role === 'admin') return true
    if (user?.role === 'support') {
      return item.createdBy === user.id && !item.isVisible
    }
    return false
  }

  const canToggleVisibility = () => {
    return user?.role === 'super_admin' || user?.role === 'admin'
  }

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code)
        ? prev.filter(l => l !== code)
        : [...prev, code]
    )
    setPage(1) // Reset to first page when filter changes
  }

  const availableLanguageCodes = Object.keys(languageNames).sort((a, b) => a.localeCompare(b))

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('media.title')}</h1>
        <Button type="primary">{t('media.addNew')}</Button>
      </div>

      <Card className="shadow-xl">
          <div className="mb-4 flex flex-wrap gap-3">
            <Input
              type="text"
              placeholder={t('media.searchPlaceholder')}
              className="w-full max-w-md"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            {/* Language Filter */}
            <Dropdown placement="bottomRight" trigger={['click']}>
              <Dropdown.Trigger>
                <Button variant="outline" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>{t('media.filterLanguages')} ({selectedLanguages.length})</span>
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Menu className="w-[36rem] max-h-[32rem] overflow-y-auto p-2">
                <div className="px-2 py-3">
                  <h3 className="font-bold text-sm mb-1">{t('media.filterLanguages')}</h3>
                  <p className="text-xs text-base-content/70">
                    {t('media.filterInfo')}
                  </p>
                </div>
                <Divider className="my-0" />
                <Row gutter={4}>
                  {availableLanguageCodes.map((code) => (
                    <Col span={8} key={code}>
                      <label className="cursor-pointer flex items-center justify-start gap-2 p-2">
                        <Checkbox
                          size="sm"
                          checked={selectedLanguages.includes(code)}
                          onChange={(checked) => toggleLanguage(code)}
                        />
                        <span className="text-sm">{t(`languageNames.${code}`)}</span>
                      </label>
                    </Col>
                  ))}
                </Row>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-16">{t('media.id')}</th>
                  <th>{t('media.name')}</th>
                  <th className="w-32">{t('media.type')}</th>
                  <th className="w-48">{t('media.languages')}</th>
                  <th className="w-32">{t('media.inventory')}</th>
                  <th className="w-32">{t('media.status')}</th>
                  <th className="w-44">{t('media.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        {!item.isVisible && (
                          <Badge size="sm" color="warning">{t('media.draft')}</Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge color="secondary">{item.type}</Badge>
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {item.languages.map((lang) => (
                          <Badge key={lang} size="sm" color="accent">
                            {t(`languageNames.${lang}`)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      {item.trackInventory && item.inventoryStock ? (
                        <div className="space-y-1">
                          <div className="text-xs space-y-1">
                            {Object.entries(item.inventoryStock)
                              .sort(([a], [b]) => Number(b) - Number(a))
                              .map(([bundleSize, count]) => {
                                const totalTracts = Object.entries(item.inventoryStock!).reduce(
                                  (sum, [size, qty]) => sum + Number(size) * qty,
                                  0
                                )
                                const isLow = item.lowStockThreshold !== null && totalTracts <= item.lowStockThreshold
                                return (
                                  <div key={bundleSize} className={`flex items-center gap-1 ${isLow ? 'text-error font-semibold' : ''}`}>
                                    <Button
                                      size="xs"
                                      shape="circle"
                                      onClick={() => handleInventoryAdjust(item.id, Number(bundleSize), count - 1)}
                                      disabled={count <= 0}
                                    >
                                      -
                                    </Button>
                                    <span className="font-mono min-w-[3rem] text-center">{count}×{bundleSize}</span>
                                    <Button
                                      size="xs"
                                      shape="circle"
                                      onClick={() => handleInventoryAdjust(item.id, Number(bundleSize), count + 1)}
                                    >
                                      +
                                    </Button>
                                    {isLow && bundleSize === Object.keys(item.inventoryStock!).sort((a, b) => Number(b) - Number(a))[0] && (
                                      <Badge size="xs" color="error" className="ml-1">{t('media.lowStock')}</Badge>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                          {canToggleVisibility() && (
                            <Button
                              size="xs"
                              ghost
                              className="text-error"
                              onClick={() => handleDisableTracking(item.id)}
                            >
                              {t('media.disableTracking')}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div>
                          {canToggleVisibility() ? (
                            <Button
                              size="xs"
                              type="primary"
                              onClick={() => handleEnableTracking(item)}
                            >
                              {t('media.enable')}
                            </Button>
                          ) : (
                            <Badge size="sm" color="default">{t('media.noTracking')}</Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {canToggleVisibility() ? (
                        <Toggle
                          checked={item.isVisible}
                          onChange={(checked) =>
                            toggleVisibleMutation.mutate({
                              id: item.id,
                              isVisible: checked,
                            })
                          }
                        />
                      ) : (
                        <Badge color={item.isVisible ? 'success' : 'warning'}>
                          {item.isVisible ? t('media.statusVisible') : t('media.statusDraft')}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {canEditMedia(item) && (
                          <Button size="sm" color="info">{t('media.edit')}</Button>
                        )}
                        {canEditMedia(item) && (
                          <Button
                            size="sm"
                            color="error"
                            onClick={() => {
                              Modal.confirm({
                                title: t('media.deleteConfirm'),
                                content: t('media.deleteMessage'),
                                okText: t('common.delete'),
                                cancelText: t('common.cancel'),
                                type: 'error',
                                onOk: () => {
                                  deleteMutation.mutate(item.id)
                                },
                              })
                            }}
                          >
                            {t('media.delete')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.meta.lastPage > 1 && (
            <div className="flex justify-center mt-4">
              <div className="join">
                <Button
                  className="join-item"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  {t('common.previous')}
                </Button>
                <Button className="join-item">
                  {t('common.page', { current: page, total: data.meta.lastPage })}
                </Button>
                <Button
                  className="join-item"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.meta.lastPage}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
      </Card>

      {/* Enable Inventory Tracking Modal */}
      <Modal
        open={trackingModalMediaId !== null}
        onCancel={() => setTrackingModalMediaId(null)}
        title={t('media.enableInventoryTracking')}
        footer={[
          <Button
            key="cancel"
            onClick={() => setTrackingModalMediaId(null)}
          >
            {t('common.cancel')}
          </Button>,
          <Button
            key="enable"
            type="primary"
            onClick={() => {
              const item = data?.data.find((i) => i.id === trackingModalMediaId)
              if (item) handleConfirmEnableTracking(item)
            }}
            disabled={enableTrackingMutation.isPending}
            loading={enableTrackingMutation.isPending}
          >
            {t('media.enable')}
          </Button>
        ]}
      >
        <p className="mb-4">{t('media.enableTrackingMessage')}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {t('media.lowStockThreshold')}
          </label>
          <Input
            type="number"
            className="w-full"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(Number(e.target.value))}
            min={0}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('media.lowStockThresholdHint')}
          </p>
        </div>
      </Modal>
    </div>
  )
}
