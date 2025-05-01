<template>
    <div class="dashboard-view">
      <div class="container">
  <div class="product-manager-view">
      <div class="container">
          <div class="product-manager-container">
              <!-- Header -->
              <header class="page-header">
                  <h1 class="page-title">Manajemen Produk</h1>
                  <div class="d-flex flex-wrap gap-2 align-items-center">
                       <!-- View Toggle -->
                       <div class="btn-group btn-group-sm" role="group" aria-label="View Mode Toggle">
                           <button type="button" class="btn"
                               :class="viewMode === 'active' ? 'btn-primary active' : 'btn-outline-secondary'"
                               @click="switchViewMode('active')" :disabled="isLoading">
                               <i class="fas fa-list me-1"></i> Daftar Aktif
                           </button>
                           <button type="button" class="btn"
                               :class="viewMode === 'trashed' ? 'btn-primary active' : 'btn-outline-secondary'"
                               @click="switchViewMode('trashed')" :disabled="isLoading">
                               <i class="fas fa-trash me-1"></i> Tempat Sampah
                               <span v-if="trashedCount > 0" class="badge bg-danger ms-1 rounded-pill">{{ trashedCountForDisplay }}</span>
                           </button>
                       </div>
                      <!-- Action Buttons -->
                      <button v-if="viewMode === 'active'" @click="openAddModal" class="btn btn-primary btn-sm" :disabled="isLoading">
                          <i class="fas fa-plus me-1"></i> Tambah Baru
                      </button>
                      <button v-if="viewMode === 'active'" @click="triggerExport" class="btn btn-outline-success btn-sm" :disabled="isExporting || isLoading">
                          <span v-if="isExporting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-file-excel me-1"></i> Export
                      </button>
                      <button v-if="viewMode === 'active'" @click="openImportModal" class="btn btn-outline-info btn-sm" :disabled="isLoading">
                         <i class="fas fa-file-import me-1"></i> Import
                      </button>
                  </div>
              </header>

              <!-- Filters Section -->
              <div class="filter-section card shadow-sm mb-4">
                   <div class="card-body d-flex flex-column flex-md-row flex-wrap gap-3 align-items-md-center">
                       <div class="filter-item flex-grow-1 mb-2 mb-md-0" style="min-width: 200px;">
                           <label for="searchFilterProduct" class="form-label visually-hidden">Cari Produk</label>
                          <div class="input-group input-group-sm">
                               <span class="input-group-text bg-light"><i class="fas fa-search fa-fw"></i></span>
                              <input type="text" id="searchFilterProduct" class="form-control" :placeholder="`Cari nama/SKU di ${viewMode === 'active' ? 'daftar aktif' : 'tempat sampah'}...`" v-model.lazy="filters.search" @keyup.enter="applyFilters" :disabled="isLoading"/>
                               <button v-if="filters.search" class="btn btn-outline-secondary" type="button" @click="clearSearch" title="Hapus Pencarian" :disabled="isLoading"><i class="fas fa-times"></i></button>
                          </div>
                       </div>
                       <div v-if="viewMode === 'active'" class="filter-item" style="min-width: 150px;">
                           <label for="publishedFilter" class="form-label visually-hidden">Filter Status</label>
                           <select id="publishedFilter" class="form-select form-select-sm" v-model="filters.published_status" @change="applyFilters" :disabled="isLoading">
                               <option value="">Semua Status</option> <option value="true">Published</option> <option value="false">Draft</option>
                           </select>
                      </div>
                       <div class="filter-item ms-md-auto">
                           <button class="btn btn-sm btn-primary" @click="applyFilters" :disabled="isLoading"><i class="fas fa-check me-1"></i> Terapkan</button>
                           <button v-if="hasActiveFilters" class="btn btn-sm btn-outline-secondary ms-2" @click="clearAllFilters" :disabled="isLoading" title="Hapus Semua Filter"><i class="fas fa-eraser"></i></button>
                       </div>
                  </div>
              </div>

              <!-- Feedback Section -->
              <div class="feedback-section mb-3">
                  <div v-if="isLoading && (viewMode === 'active' ? !products.length : !trashedProducts.length)" class="alert alert-info d-flex align-items-center shadow-sm"><div class="spinner-border spinner-border-sm me-3"></div><span>Memuat data produk {{ viewMode === 'trashed' ? ' sampah' : '' }}...</span></div>
                  <div v-if="error && !showModal && !showAuditModal && !showImportModal" class="alert alert-danger alert-dismissible fade show shadow-sm"><i class="fas fa-exclamation-triangle me-2"></i> <span v-html="error"></span> <button type="button" class="btn-close btn-sm" @click="clearError" aria-label="Close"></button></div>
                  <div v-if="successMessage" class="alert alert-success alert-dismissible fade show shadow-sm"><i class="fas fa-check-circle me-2"></i> {{ successMessage }} <button type="button" class="btn-close btn-sm" @click="successMessage = null" aria-label="Close"></button></div>
                  <div v-if="!isLoading && (viewMode === 'active' ? products.length === 0 : trashedProducts.length === 0) && !error" class="alert alert-secondary text-center shadow-sm">
                      <i class="fas fa-box-open me-2"></i> Tidak ada produk ditemukan
                      <span v-if="hasActiveFilters"> sesuai filter</span>
                      <span v-if="viewMode === 'active' && !hasActiveFilters">. Silakan tambahkan produk baru.</span>
                      <span v-if="viewMode === 'trashed' && !filters.search"> di tempat sampah.</span>
                      <button v-if="hasActiveFilters" @click="clearAllFilters" class="btn btn-sm btn-link p-0 ms-2">Hapus Filter</button>
                  </div>
                   <div v-if="exportMessage" class="alert alert-info alert-dismissible fade show shadow-sm"><i class="fas fa-info-circle me-2"></i> {{ exportMessage }} <button type="button" class="btn-close btn-sm" @click="exportMessage = null" aria-label="Close"></button></div>
              </div>

              <!-- Main Content Area -->
              <div class="main-content-area mb-4">
                 <!-- Loading Indicator -->
                 <div v-if="isLoading" class="loading-indicator text-center py-5">
                   <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
                   <p class="mt-3 text-muted">Memuat data produk {{ viewMode === 'trashed' ? ' sampah' : '' }}...</p>
                 </div>

                 <!-- Data Display (Tables) -->
                 <div v-else-if="!error">
                     <!-- Active Table -->
                     <div v-if="viewMode === 'active'" class="table-container shadow-sm">
                        <div v-if="products.length > 0" class="table-responsive">
                         <table class="table table-hover align-middle modern-table">
                           <thead>
                             <tr>
                               <th scope="col" style="width: 5%;">#</th>
                               <th scope="col" style="width: 15%;" @click="changeSort('sku')" class="sortable-header">SKU <i :class="getSortIcon('sku')"></i></th>
                               <th scope="col" @click="changeSort('name')" class="sortable-header">Nama Produk <i :class="getSortIcon('name')"></i></th>
                               <th scope="col" style="width: 12%;" @click="changeSort('is_published')" class="sortable-header">Status <i :class="getSortIcon('is_published')"></i></th>
                               <th scope="col" style="width: 15%;" @click="changeSort('launch_date')" class="sortable-header">Tgl Launch <i :class="getSortIcon('launch_date')"></i></th>
                               <th scope="col" class="text-center" style="width: 15%;">Aksi</th>
                             </tr>
                           </thead>
                           <tbody>
                             <tr v-for="(product, index) in products" :key="product.uuid">
                               <td>{{ (pagination.currentPage - 1) * pagination.perPage + index + 1 }}</td>
                               <td class="text-muted small">{{ product.sku }}</td>
                               <td class="fw-medium">{{ product.name }}</td>
                               <td><span :class="['badge', product.is_published ? 'bg-success-light text-success' : 'bg-secondary-light text-secondary']">{{ product.is_published ? 'Published' : 'Draft' }}</span></td>
                               <td>{{ formatDateShort(product.launch_date) }}</td>
                               <td>
                                 <div class="action-buttons">
                                   <button @click="openEditModal(product)" class="btn btn-icon btn-outline-primary" title="Edit Produk" :disabled="actionInProgress(product.uuid)"><i class="fas fa-pencil-alt"></i></button>
                                   <button @click="openAuditModal(product)" class="btn btn-icon btn-outline-info" title="Lihat Riwayat Audit" :disabled="actionInProgress(product.uuid)"><i class="fas fa-history"></i></button>
                                   <button @click="confirmDeleteProduct(product.uuid, product.name)" class="btn btn-icon btn-outline-danger" title="Hapus Produk (Trash)" :disabled="actionInProgress(product.uuid)"><span v-if="deletingId === product.uuid" class="spinner-border spinner-border-sm"></span><i v-else class="fas fa-trash-alt"></i></button>
                                 </div>
                               </td>
                             </tr>
                           </tbody>
                         </table>
                        </div>
                     </div>

                     <!-- Trashed Table -->
                      <div v-if="viewMode === 'trashed'" class="table-container shadow-sm">
                         <div v-if="trashedProducts.length > 0" class="table-responsive">
                             <table class="table table-hover align-middle modern-table">
                                 <thead>
                                     <tr>
                                         <th scope="col" style="width: 5%;">#</th>
                                         <th scope="col" style="width: 15%;">SKU</th>
                                         <th scope="col">Nama Produk</th>
                                         <th scope="col" style="width: 20%;">Dihapus Pada</th>
                                         <th scope="col" class="text-center" style="width: 20%;">Aksi</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     <tr v-for="(product, index) in trashedProducts" :key="product.uuid">
                                          <td>{{ (trashedPagination.currentPage - 1) * trashedPagination.perPage + index + 1 }}</td>
                                          <td class="text-muted small">{{ product.sku }}</td>
                                          <td class="fw-medium">{{ product.name }}</td>
                                          <td>{{ formatDate(product.deleted_at) }}</td>
                                          <td>
                                             <div class="action-buttons">
                                                 <button @click="restoreProduct(product.uuid, product.name)" class="btn btn-icon btn-outline-success" title="Pulihkan Produk" :disabled="actionInProgress(product.uuid)"><span v-if="restoringId === product.uuid" class="spinner-border spinner-border-sm"></span><i v-else class="fas fa-undo-alt"></i></button>
                                                 <button @click="confirmForceDeleteProduct(product.uuid, product.name)" class="btn btn-icon btn-outline-danger" title="Hapus Permanen" :disabled="actionInProgress(product.uuid)"><span v-if="forceDeletingId === product.uuid" class="spinner-border spinner-border-sm"></span><i v-else class="fas fa-times-circle"></i></button>
                                             </div>
                                         </td>
                                     </tr>
                                 </tbody>
                             </table>
                         </div>
                      </div>
                 </div> <!-- End Data Display -->
              </div> <!-- End Main Content Area -->


               <!-- Pagination -->
               <div v-if="!isLoading && currentTotalPages > 1" class="pagination-controls d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
                  <div class="d-flex align-items-center gap-2">
                      <label :for="'perPageSelect'+viewMode" class="form-label mb-0 text-muted small">Item/Hal:</label>
                      <select :id="'perPageSelect'+viewMode" class="form-select form-select-sm" style="width: 75px;" v-model="filters.per_page" @change="applyFilters">
                          <option value="15">15</option><option value="25">25</option><option value="50">50</option><option value="100">100</option>
                      </select>
                      <span class="text-muted small ms-2 d-none d-md-inline">Total {{ currentTotalItems }} produk {{ viewMode === 'trashed' ? ' sampah' : ''}}</span>
                  </div>
                  <nav aria-label="Page navigation">
                      <ul class="pagination pagination-sm mb-0">
                          <li class="page-item" :class="{ disabled: currentPagination.currentPage <= 1 }"><a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage - 1)" aria-label="Previous">«</a></li>
                          <li v-for="page in simplePaginationRange" :key="viewMode + '_' + page" class="page-item" :class="{ active: page === currentPagination.currentPage, disabled: page === '...' }"><a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a> <span v-else class="page-link">...</span></li>
                          <li class="page-item" :class="{ disabled: currentPagination.currentPage >= currentTotalPages }"><a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage + 1)" aria-label="Next">»</a></li>
                      </ul>
                  </nav>
              </div>

              <!-- Add/Edit Product Modal -->
              <div v-if="showModal" class="modal-overlay" @click.self="closeAndResetModal">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                  <div class="modal-content shadow-lg">
                    <div class="modal-header"><h5 class="modal-title"><i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2']"></i>{{ isEditing ? 'Edit Produk' : 'Tambah Produk Baru' }}</h5><button type="button" class="btn-close" @click="closeAndResetModal" aria-label="Close"></button></div>
                    <div class="modal-body">
                      <div v-if="modalError" class="alert alert-danger alert-dismissible fade show"><div v-html="modalError"></div><button type="button" class="btn-close btn-sm" @click="modalError = null" aria-label="Close"></button></div>
                      <form @submit.prevent="saveProduct" id="productForm" class="modern-form" novalidate>
                         <div class="row">
                           <div class="col-md-6"><div class="form-group mb-3"><label for="productName" class="form-label">Nama Produk <span class="text-danger">*</span></label><input type="text" class="form-control" id="productName" v-model.trim="currentProduct.name" required placeholder="Nama Produk" :disabled="isSaving"/></div></div>
                           <div class="col-md-6"><div class="form-group mb-3"><label for="productSku" class="form-label">SKU <span class="text-danger">*</span></label><input type="text" class="form-control" id="productSku" v-model.trim="currentProduct.sku" required placeholder="Kode Unik Produk" :disabled="isSaving"/></div></div>
                        </div>
                        <div class="row">
                            <div class="col-md-6"><div class="form-group mb-3"><label for="launchDate" class="form-label">Tanggal Launch</label><input type="date" class="form-control" id="launchDate" v-model="currentProduct.launch_date" :disabled="isSaving"/></div></div>
                            <div class="col-md-6"><div class="form-group mb-3"><label class="form-label d-block">Status Publikasi</label><div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="isPublished" v-model="currentProduct.is_published" :disabled="isSaving"><label class="form-check-label" for="isPublished">{{ currentProduct.is_published ? 'Published' : 'Draft' }}</label></div></div></div>
                        </div>
                        <div class="form-group mb-3"><label for="productDescription" class="form-label">Deskripsi</label><textarea class="form-control" id="productDescription" rows="3" v-model="currentProduct.description" placeholder="Deskripsi singkat produk" :disabled="isSaving"></textarea></div>
                        <div class="form-group mb-3"><label for="productionDetails" class="form-label">Detail Produksi (JSON)</label><textarea class="form-control" id="productionDetails" rows="2" v-model="currentProduct.production_details" placeholder='Contoh: {"warna": "Merah", "ukuran": "XL"}' :disabled="isSaving"></textarea><small class="form-text text-muted">Masukkan dalam format JSON yang valid.</small></div>
                        <div class="form-group mb-3">
                          <label for="productAttachment" class="form-label">Attachment (PDF)</label><input type="file" class="form-control" id="productAttachment" accept=".pdf" @change="handleFileChange" :disabled="isSaving">
                          <div v-if="attachmentPreviewUrl || currentProduct.attachment_path" class="mt-2 d-flex align-items-center"><a :href="attachmentPreviewUrl || getPublicUrl(currentProduct.attachment_path)" target="_blank" class="me-2 btn btn-sm btn-outline-secondary"><i class="fas fa-paperclip me-1"></i> Lihat</a><button type="button" class="btn btn-sm btn-outline-danger" @click="removeAttachment" :disabled="isSaving"><i class="fas fa-times"></i> Hapus</button></div>
                          <input type="hidden" name="remove_attachment" :value="currentProduct.remove_attachment_flag ? '1' : '0'">
                        </div>
                         <hr class="my-4">
                        <div class="materials-section mb-3">
                          <h6 class="mb-3">Material yang Dibutuhkan</h6>
                           <div v-if="isLoadingMaterialOptions" class="text-center text-muted mb-3"><div class="spinner-border spinner-border-sm me-2"></div> Memuat opsi material...</div>
                           <div v-else>
                               <div v-for="(materialItem, index) in currentProduct.materials" :key="index" class="material-item-row row gx-2 mb-2 align-items-center">
                                   <div class="col-md-4">
                                       <select class="form-select form-select-sm" v-model="materialItem.material_id" required :disabled="isSaving">
                                           <option value="" disabled>Pilih Material...</option>
                                           <option v-for="option in materialOptions" :key="option.id" :value="option.id">{{ option.text }}</option>
                                      </select>
                                  </div>
                                   <div class="col-md-2"><input type="number" class="form-control form-control-sm" v-model.number="materialItem.quantity_needed" placeholder="Qty" required min="0" step="any" :disabled="isSaving"/></div>
                                   <div class="col-md-3"><input type="text" class="form-control form-control-sm" v-model="materialItem.pivot_notes" placeholder="Catatan (opsional, JSON)" :disabled="isSaving"/></div>
                                   <div class="col-auto"><div class="form-check form-check-inline pt-1"><input class="form-check-input" type="checkbox" :id="'critical_'+index" v-model="materialItem.is_critical" :disabled="isSaving"><label class="form-check-label small" :for="'critical_'+index">Kritis</label></div></div>
                                   <div class="col-md-2">
                                        <input type="datetime-local" class="form-control form-control-sm" v-model="materialItem.specification_approved_at" placeholder="Tgl Approval Spec" :disabled="isSaving" style="font-size: 0.8rem; padding: 0.3rem 0.5rem;"/>
                                   </div>
                                   <div class="col-auto"><button type="button" @click="removeMaterialRow(index)" class="btn btn-sm btn-icon btn-outline-danger" title="Hapus Material" :disabled="isSaving"><i class="fas fa-trash"></i></button></div>
                               </div>
                               <button type="button" @click="addMaterialRow" class="btn btn-sm btn-outline-success mt-2" :disabled="isSaving"><i class="fas fa-plus me-1"></i> Tambah Material</button>
                           </div>
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" @click="closeAndResetModal" :disabled="isSaving">Batal</button><button type="submit" form="productForm" class="btn btn-primary" :disabled="isSaving || !currentProduct.name || !currentProduct.sku"><span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>{{ isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Produk') }}</button></div>
                  </div>
                </div>
              </div> <!-- End Add/Edit Product Modal -->

              <!-- Audit Modal -->
              <div v-if="showAuditModal" class="modal-overlay" @click.self="closeAuditModal">
                <div class="modal-dialog modal-dialog-centered modal-xl">
                  <div class="modal-content shadow-lg">
                    <div class="modal-header"><h5 class="modal-title"><i class="fas fa-history me-2 text-info"></i>Riwayat Audit: <span class="fw-medium">{{ currentAuditedProduct.name }}</span><small class="d-block text-muted fw-normal">({{ currentAuditedProduct.uuid }})</small></h5><button type="button" class="btn-close" @click="closeAuditModal" aria-label="Close"></button></div>
                    <div class="modal-body audit-modal-body">
                      <div v-if="isLoadingAudit" class="text-center py-5"><div class="spinner-border text-info"></div><p class="mt-2 text-muted">Memuat riwayat...</p></div>
                      <div v-else-if="auditError" class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> {{ auditError }}</div>
                      <div v-else-if="auditLog.length === 0" class="alert alert-secondary text-center"><i class="fas fa-info-circle me-2"></i> Tidak ada riwayat audit.</div>
                      <div v-else class="table-responsive">
                          <table class="table table-sm table-bordered table-striped audit-table">
                              <thead class="table-light"><tr><th>Waktu</th><th>Event</th><th>User</th><th>Perubahan</th><th>IP</th></tr></thead>
                              <tbody>
                                  <tr v-for="audit in auditLog" :key="audit.id">
                                      <td class="small text-nowrap">{{ formatDate(audit.created_at) }}</td>
                                      <td class="text-capitalize"><span :class="['badge', `audit-event-${audit.event}`]">{{ audit.event }}</span></td>
                                      <td class="small">{{ audit.user?.name ?? 'System' }}</td>
                                      <td>
                                          <div v-if="audit.event !== 'created'" class="audit-changes small">
                                              <div v-for="(newValue, key) in audit.new_values" :key="'new_'+key">
                                                  <div v-if="formatAuditValue(audit.old_values?.[key]) !== formatAuditValue(newValue)">
                                                      <strong class="text-capitalize">{{ formatAuditKey(key) }}:</strong>
                                                      <span class="text-danger text-decoration-line-through me-1" v-html="formatAuditValue(audit.old_values?.[key])"></span>
                                                      <i class="fas fa-arrow-right fa-xs mx-1 text-muted"></i>
                                                      <span class="text-success" v-html="formatAuditValue(newValue)"></span>
                                                  </div>
                                              </div>
                                              <div v-for="(oldValue, key) in audit.old_values" :key="'old_'+key">
                                                  <template v-if="!audit.new_values?.hasOwnProperty(key)">
                                                      <strong class="text-capitalize">{{ formatAuditKey(key) }}:</strong>
                                                      <span class="text-danger text-decoration-line-through me-1" v-html="formatAuditValue(oldValue)"></span>
                                                      <i class="fas fa-arrow-right fa-xs mx-1 text-muted"></i>
                                                      <span class="text-muted">[Dihapus]</span>
                                                  </template>
                                              </div>
                                          </div>
                                          <div v-else class="audit-changes small">
                                               <div v-for="(newValue, key) in audit.new_values" :key="'created_'+key">
                                                   <strong class="text-capitalize">{{ formatAuditKey(key) }}:</strong>
                                                   <span class="text-success" v-html="formatAuditValue(newValue)"></span>
                                               </div>
                                          </div>
                                      </td>
                                      <td class="small text-muted">{{ audit.ip_address }}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                       <div v-if="!isLoadingAudit && auditLog.length > 0 && auditPagination.totalPages > 1" class="d-flex justify-content-center mt-3">
                           <nav aria-label="Audit Log Pagination">
                               <ul class="pagination pagination-sm mb-0">
                                   <li class="page-item" :class="{ disabled: auditPagination.currentPage <= 1 }"><a class="page-link" href="#" @click.prevent="changeAuditPage(auditPagination.currentPage - 1)">«</a></li>
                                   <li v-for="page in simpleAuditPaginationRange" :key="'audit_'+page" class="page-item" :class="{ active: page === auditPagination.currentPage, disabled: page === '...' }"><a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changeAuditPage(page)">{{ page }}</a><span v-else class="page-link">...</span></li>
                                   <li class="page-item" :class="{ disabled: auditPagination.currentPage >= auditPagination.totalPages }"><a class="page-link" href="#" @click.prevent="changeAuditPage(auditPagination.currentPage + 1)">»</a></li>
                               </ul>
                           </nav>
                       </div>
                    </div>
                    <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" @click="closeAuditModal">Tutup</button></div>
                  </div>
                </div>
              </div> <!-- End Audit Modal -->

              <!-- Import Modal -->
              <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
                <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content shadow-lg">
                    <div class="modal-header">
                      <h5 class="modal-title">
                        <i class="fas fa-file-import me-2"></i> Import Produk dari Excel
                      </h5>
                      <button type="button" class="btn-close" @click="closeImportModal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                      <div v-if="importError" class="alert alert-danger alert-dismissible fade show" role="alert">
                        <span v-html="importError"></span>
                        <button type="button" class="btn-close btn-sm" @click="importError = null" aria-label="Close"></button>
                      </div>
                      <div v-if="importSuccess" class="alert alert-success" role="alert">
                        <i class="fas fa-check-circle me-2"></i> {{ importSuccess }}
                      </div>
                      <div class="mb-3 text-center">
                        <button type="button" class="btn btn-outline-secondary btn-sm" @click="triggerDownloadTemplate" :disabled="isImporting || isExporting">
                          <span v-if="isExporting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-download me-1"></i> Unduh Contoh Template (.xlsx)
                        </button>
                         <p class="small text-muted mt-2">Gunakan template ini untuk memastikan format data benar.</p>
                      </div>
                      <hr>
                      <form @submit.prevent="submitImport" id="importForm">
                        <div class="form-group mb-3">
                          <label for="importFile" class="form-label">Pilih File Excel (.xlsx/.xls):</label>
                          <input type="file" class="form-control form-control-sm" id="importFile" ref="importFileRef" accept=".xlsx, .xls" @change="handleImportFileChange" :disabled="isImporting" required>
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer justify-content-between">
                       <button type="button" class="btn btn-outline-secondary" @click="closeImportModal" :disabled="isImporting">Batal</button>
                       <button type="submit" form="importForm" class="btn btn-primary" :disabled="isImporting || !importFile">
                         <span v-if="isImporting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                         {{ isImporting ? 'Mengimport...' : 'Import Data' }}
                       </button>
                    </div>
                  </div>
                </div>
              </div> <!-- End Import Modal -->
</div>
      </div>
          </div> <!-- End .product-manager-container -->
      </div> <!-- End .container -->
  </div> <!-- End .product-manager-view -->
</template>

<script setup>
/* eslint-disable no-unused-vars */
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';

// --- Axios Instance & Interceptors ---
const apiClient = axios.create({ baseURL: `${process.env.VUE_APP_API_URL || 'http://localhost:8000/api'}`, headers: { 'Accept': 'application/json' } });
apiClient.interceptors.request.use(config => { try { const d=localStorage.getItem('userData'); if(d){const t=JSON.parse(d)?.token; if(t){config.headers=config.headers||{}; config.headers['Authorization']=`Bearer ${t}`;}}} catch(e){console.error("Err localStorage:",e);} if (config.data instanceof FormData) { delete config.headers['Content-Type']; } else { config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json'; } return config; }, error => Promise.reject(error));
apiClient.interceptors.response.use(response => response, error => { if (error.response && (error.response.status === 401 || error.response.status === 403)) { console.error(`Auth Error (${error.response.status})`); localStorage.removeItem('userData'); window.location.href = '/login'; return Promise.reject(new Error(`Auth failed: ${error.response.status}`)); } if (error.response && error.response.status === 409) { console.warn('Conflict (409):', error.response.data?.message); } if (error.response && error.response.status === 404) { console.warn('Not Found (404):', error.response.data?.message); } if (error.response && error.response.status === 422) { console.warn('Validation (422):', error.response.data); } return Promise.reject(error); });

// --- Utility Functions ---
const formatDisplayKey = (key) => { if (key === 'is_published') return 'Status Publikasi'; if (key === 'launch_date') return 'Tgl Launch'; if (key === 'production_details') return 'Detail Produksi'; if (key === 'attachment_path') return 'Lampiran'; if (key === 'material_id') return 'ID Material'; if (key === 'quantity_needed') return 'Kuantitas'; if (key === 'is_critical') return 'Kritis'; if (key === 'specification_approved_at') return 'Tgl Approv Spec'; if (key === 'notes') return 'Catatan'; return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); };
const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => { if (error?.message?.includes('Auth failed')) return 'Sesi berakhir. Silakan login lagi.'; if (error?.response) { let m=error.response.data?.message; const s=error.response.status; if (s===422&&error.response.data?.errors) { const e=error.response.data.errors; const f=Object.entries(e).map(([k,v])=>{let p='';let n=k;if(k.startsWith('materials.')){const parts=k.split('.');if(parts.length===3){const i=parseInt(parts[1],10)+1;n=formatDisplayKey(parts[2]);p=`Material ${i} (${n}): `;}else{n=formatDisplayKey(k);}} else if(k.startsWith('*.') && error.response.data.message?.includes('row')) { p = error.response.data.message + ': '; n = k.substring(2); } else{n=formatDisplayKey(k);}return `${p}${v.join(', ')}`;}); m=f.join('<br/> '); m=`Data tidak valid:<br/> ${m}`; } else if(s===404){m=m||'Data tidak ditemukan.'} else if(s===403){m=m||'Aksi tidak diizinkan.'} else if(s===409){m=m||'Konflik data.'} else if(s>=500){m='Server error.';console.error('Server Err:',error.response.data);} return m||`Error ${s}: ${error.response.statusText||defaultMessage}`; } else if(error?.request){return 'Tidak dapat terhubung server.';} return error?.message||defaultMessage; };
const formatDateShort = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return d; } };
const formatDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false }); } catch (e) { return d; } };
const getPublicUrl = (p) => { if (!p) return '#'; const b=process.env.VUE_APP_API_URL||'http://localhost:8000'; const c=b.endsWith('/api')?b.substring(0,b.length-4):b; return `${c.replace(/\/$/,'')}/storage/${p}`; };
const formatAuditKey = formatDisplayKey;
const formatAuditValue = (v) => { if(v===null||typeof v==='undefined')return'<span class="text-muted">[Kosong]</span>'; if(typeof v==='boolean')return v?'<span class="text-success">Published</span>':'<span class="text-secondary">Draft</span>'; if(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}:\d{2}/.test(v)){return formatDate(v);} if(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)){return formatDateShort(v);} if(typeof v==='string'&&v.length>150){return v.substring(0,150)+'...';} if(typeof v==='object'){try{return `<pre class="audit-json">${JSON.stringify(v,null,2)}</pre>`;}catch{return'[Object]';}} return v; };


// --- Component State ---
const viewMode = ref('active');
const products = ref([]);
const trashedProducts = ref([]);
const pagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedPagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedCount = ref(0);
const filters = reactive({ search: '', published_status: '', material_id: '', sort_by: 'created_at', sort_direction: 'desc', page: 1, per_page: 15 });
const isLoading = ref(false);
const isSaving = ref(false);
const deletingId = ref(null);
const restoringId = ref(null);
const forceDeletingId = ref(null);
const error = ref(null);
const successMessage = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const modalError = ref(null);
const currentProduct = reactive({ uuid: null, name: '', sku: '', description: '', production_details: '', launch_date: null, is_published: false, attachment: null, attachment_path: null, remove_attachment_flag: false, materials: [] });
const attachmentPreviewUrl = ref(null);
const materialOptions = ref([]);
const isLoadingMaterialOptions = ref(false);
const isExporting = ref(false);
const exportMessage = ref(null);
const showAuditModal = ref(false);
const currentAuditedProduct = reactive({ uuid: null, name: '' });
const auditLog = ref([]);
const auditPagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 10 });
const isLoadingAudit = ref(false);
const auditError = ref(null);
// Import State
const showImportModal = ref(false);
const isImporting = ref(false);
const importFile = ref(null);
const importFileRef = ref(null);
const importError = ref(null);
const importSuccess = ref(null);

// --- Computed Properties ---
const currentPagination = computed(() => viewMode.value === 'active' ? pagination.value : trashedPagination.value);
const currentTotalPages = computed(() => currentPagination.value.totalPages);
const currentTotalItems = computed(() => currentPagination.value.totalItems);
const trashedCountForDisplay = computed(() => trashedCount.value > 99 ? '99+' : trashedCount.value);
const hasActiveFilters = computed(() => filters.search || (viewMode.value === 'active' && (filters.published_status !== '' || filters.material_id !== '')));
const getSortIcon = (column) => { if (viewMode.value !== 'active' || filters.sort_by !== column) return 'fas fa-sort text-muted opacity-50'; return filters.sort_direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'; };
const simplePaginationRange = computed(() => { const c=currentPagination.value.currentPage; const l=currentTotalPages.value; if(!l||l<=1)return l===1?[1]:[]; const d=1;const r=[];const rd=[];let ll; r.push(1);for(let i=Math.max(2,c-d);i<=Math.min(l-1,c+d);i++){r.push(i);}if(l>1)r.push(l); const u=[...new Set(r)].sort((a,b)=>a-b); u.forEach((i)=>{if(ll){if(i-ll===2)rd.push(ll+1);else if(i-ll>2)rd.push('...');}rd.push(i);ll=i;}); return rd; });
const simpleAuditPaginationRange = computed(() => { const c=auditPagination.value.currentPage; const l=auditPagination.value.totalPages; if(!l||l<=1)return l===1?[1]:[]; const d=1;const r=[];const rd=[];let ll; r.push(1);for(let i=Math.max(2,c-d);i<=Math.min(l-1,c+d);i++){r.push(i);}if(l>1)r.push(l); const u=[...new Set(r)].sort((a,b)=>a-b); u.forEach((i)=>{if(ll){if(i-ll===2)rd.push(ll+1);else if(i-ll>2)rd.push('...');}rd.push(i);ll=i;}); return rd; });
const actionInProgress = (uuid) => deletingId.value === uuid || restoringId.value === uuid || forceDeletingId.value === uuid;

// --- API Functions ---
async function fetchProducts() { isLoading.value = true; error.value = null; filters.page = pagination.value.currentPage; filters.per_page = parseInt(filters.per_page, 10); const q = { ...filters }; delete q.page; delete q.per_page; const p = Object.entries(q).reduce((a, [k, v]) => { if (v !== '' && v !== null) a[k] = v; return a; }, { page: filters.page, per_page: filters.per_page }); try { const r = await apiClient.get('/products', { params: p }); if (r.data && r.data.data) { products.value = r.data.data; pagination.value = { currentPage: r.data.meta?.current_page ?? 1, totalPages: r.data.meta?.last_page ?? 1, totalItems: r.data.meta?.total ?? 0, perPage: parseInt(r.data.meta?.per_page ?? filters.per_page, 10) }; await fetchTrashCount(); } else { products.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page }; } } catch (err) { error.value = getErrorMessage(err, 'Gagal memuat produk.'); products.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page }; } finally { isLoading.value = false; } }
async function fetchTrashedProducts() { isLoading.value = true; error.value = null; const tp = trashedPagination.value.currentPage; const tpp = parseInt(filters.per_page, 10); const p = { page: tp, per_page: tpp, ...(filters.search && { search: filters.search }), }; try { const r = await apiClient.get('/products/trash', { params: p }); if (r.data && r.data.data) { trashedProducts.value = r.data.data; trashedPagination.value = { currentPage: r.data.meta?.current_page ?? 1, totalPages: r.data.meta?.last_page ?? 1, totalItems: r.data.meta?.total ?? 0, perPage: parseInt(r.data.meta?.per_page ?? tpp, 10) }; trashedCount.value = r.data.meta?.total ?? 0; } else { trashedProducts.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: tpp }; trashedCount.value = 0; } } catch (err) { error.value = getErrorMessage(err, 'Gagal memuat produk sampah.'); trashedProducts.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: tpp }; trashedCount.value = 0; } finally { isLoading.value = false; } }
async function fetchTrashCount() { if (viewMode.value === 'active') { try { const r = await apiClient.get('/products/trash', { params: { per_page: 1 } }); trashedCount.value = r.data.meta?.total ?? 0; } catch (err) { console.error("Fail fetch trash count:", getErrorMessage(err)); } } }
async function fetchMaterialOptions() { if (materialOptions.value.length > 0 && !isEditing.value) return; isLoadingMaterialOptions.value = true; try { const r = await apiClient.get('/material-options'); materialOptions.value = r.data || []; } catch (err) { console.error("Error fetch material opts:", err); modalError.value = getErrorMessage(err, "Gagal load opsi material."); } finally { isLoadingMaterialOptions.value = false; } }
async function saveProduct() { if (!currentProduct.name || !currentProduct.sku) { modalError.value = "Nama & SKU wajib."; return; } /* Other validations... */ isSaving.value = true; modalError.value = null; error.value = null; const fd = new FormData(); fd.append('name', currentProduct.name); fd.append('sku', currentProduct.sku); fd.append('description', currentProduct.description || ''); fd.append('production_details', currentProduct.production_details || ''); fd.append('launch_date', currentProduct.launch_date || ''); fd.append('is_published', currentProduct.is_published ? '1' : '0'); if (currentProduct.attachment instanceof File) fd.append('attachment', currentProduct.attachment); if (isEditing.value && currentProduct.remove_attachment_flag) fd.append('remove_attachment', '1'); currentProduct.materials.forEach((item, i) => { if (item.material_id && item.quantity_needed !== '' && item.quantity_needed !== null) { fd.append(`materials[${i}][material_id]`, item.material_id); fd.append(`materials[${i}][quantity_needed]`, item.quantity_needed); fd.append(`materials[${i}][notes]`, item.pivot_notes || ''); fd.append(`materials[${i}][is_critical]`, item.is_critical ? '1' : '0'); fd.append(`materials[${i}][specification_approved_at]`, item.specification_approved_at || ''); } }); try { let r; const cfg = {}; if (isEditing.value) { fd.append('_method', 'PUT'); r = await apiClient.post(`/products/${currentProduct.uuid}`, fd, cfg); } else { r = await apiClient.post('/products', fd, cfg); } if ((r.status === 200 || r.status === 201) && r.data?.data) { setSuccessMessage(`Produk "${r.data.data.name}" ${isEditing.value ? 'diperbarui' : 'ditambahkan'}.`); closeAndResetModal(); await fetchProducts(); } else { throw new Error(r.data?.message || `Gagal ${isEditing.value ? 'simpan' : 'buat'} produk.`); } } catch (err) { modalError.value = getErrorMessage(err, `Gagal ${isEditing.value ? 'simpan' : 'buat'} produk.`); } finally { isSaving.value = false; } }
async function deleteProduct(uuid, name) { deletingId.value = uuid; error.value = null; successMessage.value = null; try { const r = await apiClient.delete(`/products/${uuid}`); if (r.status === 204) { setSuccessMessage(`Produk "${name}" dipindah ke sampah.`); if (products.value.length === 1 && pagination.value.currentPage > 1) pagination.value.currentPage--; await fetchProducts(); } else { throw new Error(r.data?.message || 'Gagal hapus produk.'); } } catch (err) { error.value = getErrorMessage(err, `Gagal pindah produk "${name}" ke sampah.`); } finally { deletingId.value = null; } }
async function restoreProduct(uuid, name) { restoringId.value = uuid; error.value = null; successMessage.value = null; try { const r = await apiClient.post(`/products/restore/${uuid}`); if (r.status === 200 && r.data?.message) { setSuccessMessage(r.data.message || `Produk "${name}" dipulihkan.`); if (trashedProducts.value.length === 1 && trashedPagination.value.currentPage > 1) trashedPagination.value.currentPage--; await fetchTrashedProducts(); } else { throw new Error(r.data?.message || `Gagal pulihkan produk "${name}".`); } } catch (err) { error.value = getErrorMessage(err, `Gagal pulihkan produk "${name}".`); } finally { restoringId.value = null; } }
async function forceDeleteProduct(uuid, name) { forceDeletingId.value = uuid; error.value = null; successMessage.value = null; const idx = trashedProducts.value.findIndex(p => p.uuid === uuid); try { const r = await apiClient.delete(`/products/force-delete/${uuid}`); if (r.status === 204) { setSuccessMessage(`Produk "${name}" dihapus permanen.`); if (idx > -1) trashedProducts.value.splice(idx, 1); const needsDec = trashedProducts.value.length === 0 && trashedPagination.value.currentPage > 1; if (needsDec) trashedPagination.value.currentPage--; await fetchTrashedProducts(); } else { throw new Error(r.data?.message || `Gagal hapus permanen produk "${name}".`); } } catch (err) { error.value = getErrorMessage(err, `Gagal hapus permanen produk "${name}".`); } finally { forceDeletingId.value = null; } }
async function fetchAuditLog(uuid, page = 1) { if (!uuid) return; isLoadingAudit.value = true; auditError.value = null; const pp = auditPagination.value.perPage; try { const r = await apiClient.get(`/products/${uuid}/audits`, { params: { page: page, per_page: pp } }); if (r.data && r.data.data) { auditLog.value = r.data.data; auditPagination.value = { currentPage: r.data.meta?.current_page ?? 1, totalPages: r.data.meta?.last_page ?? 1, totalItems: r.data.meta?.total ?? 0, perPage: parseInt(r.data.meta?.per_page ?? pp, 10) }; } else { auditLog.value = []; auditPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: pp }; } } catch (err) { auditError.value = getErrorMessage(err, 'Gagal load audit.'); auditLog.value = []; auditPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: pp }; } finally { isLoadingAudit.value = false; } }
async function triggerExport() {
isExporting.value = true;
exportMessage.value = "Mempersiapkan file export, mohon tunggu...";
error.value = null;
const exportParams = {};
if (filters.search) { exportParams.search = filters.search; }
if (filters.published_status !== '') { exportParams.is_published = filters.published_status; }
console.log("Requesting export with params:", exportParams);
try {
  const response = await apiClient.get('/products/export', { params: exportParams, responseType: 'blob', });
  if (response.status === 200 && response.data instanceof Blob) { const header = response.headers['content-disposition']; const filename = header ? header.split('filename=')[1].replace(/"/g, '') : 'products_export.xlsx'; const url = window.URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.setAttribute('download', filename); document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url); exportMessage.value = `Export (${filename}) berhasil diunduh.`; setTimeout(() => { exportMessage.value = null; }, 5000); }
  else if (response.status === 202 && response.data?.message) { exportMessage.value = response.data.message; setTimeout(() => { exportMessage.value = null; }, 7000); }
  else { let errorMsg = 'Gagal mengunduh file export. Respons tidak valid.'; if (response.data instanceof Blob && response.headers['content-type']?.includes('application/json')) { try { const errorData = JSON.parse(await response.data.text()); errorMsg = errorData.message || errorMsg; } catch { /* ignore */ } } throw new Error(errorMsg); }
} catch(err) { console.error("Export Error:", err); if (err.response && err.response.data instanceof Blob && err.response.headers['content-type']?.includes('application/json')) { try { const errorJson = JSON.parse(await err.response.data.text()); error.value = errorJson.message || 'Gagal membuat file export (server error).'; } catch (parseError) { error.value = 'Gagal membaca pesan error dari server.'; } } else { error.value = getErrorMessage(err, 'Gagal memulai atau mengunduh proses export.'); } exportMessage.value = null; }
finally { isExporting.value = false; if (exportMessage.value === "Mempersiapkan file export, mohon tunggu...") exportMessage.value = null; }
}


// --- UI Functions ---
function applyFilters() { clearError(); if (viewMode.value === 'active') { pagination.value.currentPage = 1; fetchProducts(); } else { trashedPagination.value.currentPage = 1; fetchTrashedProducts(); } }
function clearSearch() { if(filters.search) { filters.search = ''; applyFilters(); } }
function clearAllFilters() { filters.search = ''; filters.published_status = ''; filters.material_id = ''; applyFilters(); }
function clearError() { error.value = null; modalError.value = null; auditError.value = null; importError.value = null; }
function setSuccessMessage(message) { successMessage.value = message; setTimeout(() => { if(successMessage.value === message) successMessage.value = null; }, 4000); }
function changePage(page) { if (isLoading.value || page === '...') return; clearError(); if (viewMode.value === 'active') { if (page >= 1 && page <= pagination.value.totalPages && page !== pagination.value.currentPage) { pagination.value.currentPage = page; fetchProducts(); } } else { if (page >= 1 && page <= trashedPagination.value.totalPages && page !== trashedPagination.value.currentPage) { trashedPagination.value.currentPage = page; fetchTrashedProducts(); } } }
function changeSort(column) { if (viewMode.value !== 'active' || isLoading.value) return; clearError(); if (filters.sort_by === column) filters.sort_direction = filters.sort_direction === 'asc' ? 'desc' : 'asc'; else { filters.sort_by = column; filters.sort_direction = 'asc'; } applyFilters(); }
function openAddModal() { isEditing.value = false; modalError.value = null; Object.assign(currentProduct, { uuid: null, name: '', sku: '', description: '', production_details: '', launch_date: null, is_published: false, attachment: null, attachment_path: null, remove_attachment_flag: false, materials: [] }); attachmentPreviewUrl.value = null; fetchMaterialOptions(); showModal.value = true; }
function openEditModal(product) { isEditing.value = true; modalError.value = null; let pd=product.production_details; if(pd&&typeof pd==='object'){try{pd=JSON.stringify(pd,null,2);}catch{pd='';}}else if(pd===null||typeof pd==='undefined'){pd='';} Object.assign(currentProduct, { uuid:product.uuid, name:product.name, sku:product.sku, description:product.description||'', production_details:pd||'', launch_date:product.launch_date?product.launch_date.substring(0,10):null, is_published:product.is_published, attachment:null, attachment_path:product.attachment_path, remove_attachment_flag:false, materials:product.materials?product.materials.map(m=>{let pn=m.pivot?.notes??null; if(pn&&typeof pn==='object'){try{pn=JSON.stringify(pn);}catch{pn='';}}else if(pn===null||typeof pn==='undefined'){pn='';} return{material_id:m.id, quantity_needed:m.pivot?.quantity_needed??'', pivot_notes:pn||'', is_critical:m.pivot?.is_critical??false, specification_approved_at:m.pivot?.specification_approved_at?m.pivot.specification_approved_at.substring(0,16).replace('T',' '):null}; }):[] }); attachmentPreviewUrl.value = null; fetchMaterialOptions(); showModal.value = true; }
function closeAndResetModal() { showModal.value = false; isEditing.value = false; modalError.value = null; Object.assign(currentProduct, { uuid: null, name: '', sku: '', description: '', production_details: '', launch_date: null, is_published: false, attachment: null, attachment_path: null, remove_attachment_flag: false, materials: [] }); attachmentPreviewUrl.value = null; const f=document.getElementById('productAttachment'); if(f)f.value=''; }
function confirmDeleteProduct(uuid, name) { if (window.confirm(`Pindahkan produk "${name}" ke sampah?`)) deleteProduct(uuid, name); }
function confirmForceDeleteProduct(uuid, name) { if (window.confirm(`PERHATIAN! Hapus permanen produk "${name}"? Aksi ini tidak dapat diurungkan.`)) forceDeleteProduct(uuid, name); }
function addMaterialRow() { currentProduct.materials.push({ material_id: '', quantity_needed: '', pivot_notes: '', is_critical: false, specification_approved_at: null }); }
function removeMaterialRow(index) { currentProduct.materials.splice(index, 1); }
function handleFileChange(event) { const f=event.target.files[0]; if(f&&f.type==='application/pdf'){currentProduct.attachment=f;currentProduct.remove_attachment_flag=false;if(attachmentPreviewUrl.value)URL.revokeObjectURL(attachmentPreviewUrl.value);attachmentPreviewUrl.value=URL.createObjectURL(f);modalError.value=null;}else{currentProduct.attachment=null;if(attachmentPreviewUrl.value)URL.revokeObjectURL(attachmentPreviewUrl.value);attachmentPreviewUrl.value=null;if(f){modalError.value="Hanya PDF.";event.target.value='';}} }
function removeAttachment() { currentProduct.attachment=null;currentProduct.attachment_path=null;currentProduct.remove_attachment_flag=true;if(attachmentPreviewUrl.value)URL.revokeObjectURL(attachmentPreviewUrl.value);attachmentPreviewUrl.value=null;const f=document.getElementById('productAttachment');if(f)f.value=''; }
function openAuditModal(product) { currentAuditedProduct.uuid=product.uuid;currentAuditedProduct.name=product.name;auditLog.value=[];auditError.value=null;auditPagination.value.currentPage=1;showAuditModal.value=true;fetchAuditLog(product.uuid,1); }
function closeAuditModal() { showAuditModal.value = false; }
function changeAuditPage(page) { if (isLoadingAudit.value || page === '...') return; if (page >= 1 && page <= auditPagination.value.totalPages && page !== auditPagination.value.currentPage) { auditPagination.value.currentPage = page; fetchAuditLog(currentAuditedProduct.uuid, page); } }
function switchViewMode(mode) { if (mode === viewMode.value || isLoading.value) return; viewMode.value = mode; clearError(); successMessage.value = null; filters.search=''; if (mode === 'active') { filters.published_status=''; filters.material_id=''; pagination.value.currentPage=1; fetchProducts(); } else { trashedPagination.value.currentPage=1; fetchTrashedProducts(); } }

// --- Import Functions ---
function openImportModal() { importFile.value = null; importError.value = null; importSuccess.value = null; if (importFileRef.value) { importFileRef.value.value = ''; } showImportModal.value = true; }
function closeImportModal() { showImportModal.value = false; }
function handleImportFileChange(event) { const file = event.target.files[0]; if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) { importFile.value = file; importError.value = null; importSuccess.value = null; } else { importFile.value = null; if (file) { importError.value = 'Format file tidak valid. Harap pilih file .xlsx atau .xls.'; } else { importError.value = null; } event.target.value = ''; } }
async function triggerDownloadTemplate() { isExporting.value = true; exportMessage.value = 'Mengunduh template...'; error.value = null; try { const response = await apiClient.get('/products/exportcont', { // Request export endpoint
params: { template: 'yes' }, // Add parameter to request template specifically
responseType: 'blob'
}); if (response.status === 200 && response.data instanceof Blob) { const header = response.headers['content-disposition']; const filename = header ? header.split('filename=')[1].replace(/"/g, '') : 'product_import_template.xlsx'; const url = window.URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.setAttribute('download', filename); document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url); exportMessage.value = `Template (${filename}) berhasil diunduh.`; } else { throw new Error('Gagal mengunduh template.'); } } catch (err) { console.error("Error downloading template:", err); error.value = getErrorMessage(err, 'Gagal mengunduh template.'); exportMessage.value = null; } finally { isExporting.value = false; if (exportMessage.value === 'Mengunduh template...') exportMessage.value = null; if (exportMessage.value?.includes('berhasil')) setTimeout(() => { exportMessage.value = null; }, 4000); } }
async function submitImport() { if (!importFile.value) { importError.value = 'Silakan pilih file untuk diimport.'; return; } isImporting.value = true; importError.value = null; importSuccess.value = null; error.value = null; successMessage.value = null; const formData = new FormData(); formData.append('file', importFile.value); try { const response = await apiClient.post('/products/import', formData); if (response.data && response.data.status === 'success') { importSuccess.value = response.data.message || 'Data berhasil diimport.'; setTimeout(() => { closeImportModal(); if (viewMode.value === 'active') { fetchProducts(); } else { fetchTrashCount(); } }, 2000); } else { throw new Error(response.data?.message || 'Import gagal, respons tidak sesuai format.'); } } catch (err) { console.error("Error submitting import:", err); importError.value = getErrorMessage(err, 'Terjadi kesalahan saat mengimport data.'); if (importFileRef.value) { importFileRef.value.value = ''; } importFile.value = null; } finally { isImporting.value = false; } }


// --- Lifecycle Hook ---
onMounted(() => {
console.log("ProductManagerView Mounted");
fetchProducts();
});
/* eslint-enable no-unused-vars */
</script>


<style scoped>
/* Reuse styles from previous component, adjusting class names if necessary */
.product-manager-view { padding: 1.5rem 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.page-title { font-size: 1.75rem; font-weight: 500; margin-bottom: 0; }
.filter-section .card-body { padding: 1rem; }
.filter-item { margin-bottom: 0; }
.sortable-header { cursor: pointer; user-select: none; position: relative; padding-right: 1.5em; }
.sortable-header i { position: absolute; right: 0.5em; top: 50%; transform: translateY(-50%); font-size: 0.9em; }
.modern-table { border: 1px solid #dee2e6; font-size: 0.9rem; margin-bottom: 0; }
.modern-table thead th { background-color: #f8f9fa; border-bottom-width: 2px; vertical-align: middle; white-space: nowrap; }
.modern-table tbody td { vertical-align: middle; }
.modern-table tbody tr:hover { background-color: #f1f1f1; }
.table-container { border-radius: 0.375rem; overflow: hidden; border: 1px solid #dee2e6; }
.action-buttons { display: flex; gap: 0.5rem; justify-content: center; }
.btn-icon { padding: 0.3rem 0.6rem; font-size: 0.85rem; line-height: 1; }
.badge.bg-success-light { background-color: #e6f7f0; border: 1px solid #c3e6cb; color: #155724 !important; }
.badge.text-success { color: #0f5132 !important; }
.badge.bg-secondary-light { background-color: #f8f9fa; border: 1px solid #e2e3e5; color: #41464b !important; }
.badge.text-secondary { color: #495057 !important; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1050; overflow-y: auto; padding: 1rem; }
.modal-dialog { width: 100%; }
.modal-dialog:not(.modal-xl) { max-width: 500px; }
.modal-dialog.modal-lg { max-width: 800px; }
.modal-dialog.modal-xl { max-width: 1140px; }
.pagination-controls { margin-top: 1.5rem; }
.main-content-area { min-height: 200px; /* Prevent collapse during load */ }
.audit-modal-body { max-height: 70vh; overflow-y: auto; }
.audit-table { table-layout: fixed; word-wrap: break-word; font-size: 0.85rem; }
.audit-changes div { margin-bottom: 3px; }
.audit-event-created { background-color: var(--bs-success-bg-subtle); color: var(--bs-success-text-emphasis); }
.audit-event-updated { background-color: var(--bs-warning-bg-subtle); color: var(--bs-warning-text-emphasis); }
.audit-event-deleted { background-color: var(--bs-danger-bg-subtle); color: var(--bs-danger-text-emphasis); }
.audit-event-restored { background-color: var(--bs-info-bg-subtle); color: var(--bs-info-text-emphasis); }
pre.audit-json { white-space: pre-wrap; background-color: #f8f9fa; padding: 5px; border-radius: 3px; font-size: 0.9em; }
/* Responsive */
@media (max-width: 767px) { .page-header { flex-direction: column; align-items: flex-start; } .filter-section .card-body { flex-direction: column; align-items: stretch; } .filter-item { min-width: 0; margin-bottom: 0.75rem; } .filter-item:last-child { margin-bottom: 0; } .filter-item .input-group, .filter-item .form-select { width: 100%; } .filter-item .ms-md-auto { margin-left: 0 !important; margin-top: 0.5rem; display: flex; gap: 0.5rem; } .pagination-controls { flex-direction: column; align-items: center; } .pagination-controls > div:first-child { margin-bottom: 0.75rem; } }
</style>