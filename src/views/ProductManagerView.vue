<template>
  <div class="dashboard-view">
      <div class="container">
          <div class="product-manager-container"> <!-- Nama kelas dipertahankan -->
              <header class="page-header">
                  <h1 class="page-title">Manajemen Produk</h1>
                  <div class="d-flex flex-wrap gap-2 align-items-center">
                       <!-- View Toggle -->
                       <div class="btn-group btn-group-sm" role="group" aria-label="View Mode Toggle">
                           <button type="button" class="btn"
                               :class="viewMode === 'active' ? 'btn-primary active' : 'btn-outline-secondary'"
                               @click="switchViewMode('active')"
                               :disabled="isLoading">
                               <i class="fas fa-list me-1"></i> Daftar Aktif
                           </button>
                           <button type="button" class="btn"
                               :class="viewMode === 'trashed' ? 'btn-primary active' : 'btn-outline-secondary'"
                               @click="switchViewMode('trashed')"
                               :disabled="isLoading">
                               <i class="fas fa-trash me-1"></i> Tempat Sampah
                               <span v-if="trashedCount > 0" class="badge bg-danger ms-1 rounded-pill">{{ trashedCountForDisplay }}</span>
                           </button>
                       </div>
                      <!-- Tombol Tambah/Export -->
                      <button v-if="viewMode === 'active'" @click="openAddModal" class="btn btn-primary btn-sm">
                          <i class="fas fa-plus me-1"></i> Tambah Produk Baru
                      </button>
                      <button v-if="viewMode === 'active'" @click="triggerExport" class="btn btn-outline-success btn-sm" :disabled="isExporting || isLoading">
                          <span v-if="isExporting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-file-excel me-1"></i> Export
                      </button>
                      <!-- Tombol Import (Tetap dikomentari) -->
                      <!--
                       <button @click="openImportModal" class="btn btn-outline-info btn-sm">
                         <i class="fas fa-file-import me-1"></i> Import
                      </button>
                      -->
                  </div>
              </header>

              <!-- Bagian Filter -->
              <div class="filter-section card shadow-sm mb-4">
                  <div class="card-body d-flex flex-column flex-md-row flex-wrap gap-3 align-items-md-center">
                       <!-- Input Pencarian -->
                       <div class="filter-item flex-grow-1 mb-2 mb-md-0" style="min-width: 200px;">
                           <label for="searchFilterProduct" class="form-label visually-hidden">Cari Produk</label>
                          <div class="input-group input-group-sm">
                               <span class="input-group-text bg-light"><i class="fas fa-search fa-fw"></i></span>
                              <input type="text" id="searchFilterProduct" class="form-control" :placeholder="`Cari nama/SKU di ${viewMode === 'active' ? 'daftar aktif' : 'tempat sampah'}...`" v-model.lazy="filters.search" @keyup.enter="applyFilters" :disabled="isLoading"/>
                               <button v-if="filters.search" class="btn btn-outline-secondary" type="button" @click="clearSearch" title="Hapus Pencarian"><i class="fas fa-times"></i></button>
                          </div>
                       </div>
                       <!-- Filter Status Publikasi (Hanya View Aktif) -->
                       <div v-if="viewMode === 'active'" class="filter-item" style="min-width: 150px;">
                           <label for="publishedFilter" class="form-label visually-hidden">Filter Status</label>
                           <select id="publishedFilter" class="form-select form-select-sm" v-model="filters.published_status" @change="applyFilters" :disabled="isLoading">
                               <option value="">Semua Status</option> <option value="true">Published</option> <option value="false">Draft</option>
                           </select>
                      </div>
                       <!-- Tombol Terapkan/Hapus Filter -->
                       <div class="filter-item ms-md-auto">
                           <button class="btn btn-sm btn-primary" @click="applyFilters" :disabled="isLoading"><i class="fas fa-check me-1"></i> Terapkan</button>
                           <button v-if="hasActiveFilters" class="btn btn-sm btn-outline-secondary ms-2" @click="clearAllFilters" :disabled="isLoading" title="Hapus Semua Filter"><i class="fas fa-eraser"></i></button>
                       </div>
                  </div>
              </div>

              <!-- Bagian Umpan Balik (Loading, Error, Sukses) -->
              <div class="feedback-section mb-3">
                  <div v-if="isLoading && (viewMode === 'active' ? !products.length : !trashedProducts.length)" class="alert alert-info d-flex align-items-center shadow-sm"><div class="spinner-border spinner-border-sm me-3"></div><span>Memuat data produk {{ viewMode === 'trashed' ? ' sampah' : '' }}...</span></div>
                  <!-- Menggunakan v-html untuk error agar bisa menampilkan <br> dari validasi -->
                  <div v-if="error && !showModal && !showAuditModal" class="alert alert-danger alert-dismissible fade show shadow-sm"><i class="fas fa-exclamation-triangle me-2"></i> <span v-html="error"></span> <button type="button" class="btn-close btn-sm" @click="clearError"></button></div>
                  <div v-if="successMessage" class="alert alert-success alert-dismissible fade show shadow-sm"><i class="fas fa-check-circle me-2"></i> {{ successMessage }} <button type="button" class="btn-close btn-sm" @click="successMessage = null"></button></div>
                  <div v-if="!isLoading && (viewMode === 'active' ? products.length === 0 : trashedProducts.length === 0) && !error" class="alert alert-secondary text-center shadow-sm">
                      <i class="fas fa-box-open me-2"></i> Tidak ada produk ditemukan
                      <span v-if="hasActiveFilters"> sesuai filter</span>
                      <span v-if="viewMode === 'active' && !hasActiveFilters">. Silakan tambahkan produk baru.</span>
                      <span v-if="viewMode === 'trashed' && !filters.search"> di tempat sampah.</span>
                      <button v-if="hasActiveFilters" @click="clearAllFilters" class="btn btn-sm btn-link p-0 ms-2">Hapus Filter</button>
                  </div>
                   <!-- Mengubah export message menjadi alert-info -->
                   <div v-if="exportMessage" class="alert alert-info alert-dismissible fade show shadow-sm"><i class="fas fa-info-circle me-2"></i> {{ exportMessage }} <button type="button" class="btn-close btn-sm" @click="exportMessage = null"></button></div>
              </div>

              <!-- ======================= -->
              <!--      TABEL AKTIF        -->
              <!-- ======================= -->
              <div v-if="viewMode === 'active'" class="table-container shadow-sm mb-4">
                 <div class="table-responsive">
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
                       <tr v-if="isLoading"><td :colspan="6" class="text-center"><div class="d-flex justify-content-center align-items-center py-4"><div class="spinner-border text-primary"></div><span class="ms-3 text-muted">Memuat...</span></div></td></tr>
                      <tr v-for="(product, index) in products" :key="product.uuid" v-show="!isLoading">
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

              <!-- ======================= -->
              <!--     TABEL SAMPAH        -->
              <!-- ======================= -->
               <div v-if="viewMode === 'trashed'" class="table-container shadow-sm mb-4">
                  <div class="table-responsive">
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
                              <tr v-if="isLoading"><td :colspan="5" class="text-center"><div class="d-flex justify-content-center align-items-center py-4"><div class="spinner-border text-primary"></div><span class="ms-3 text-muted">Memuat...</span></div></td></tr>
                              <tr v-for="(product, index) in trashedProducts" :key="product.uuid" v-show="!isLoading">
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
                          <li class="page-item" :class="{ disabled: currentPagination.currentPage <= 1 }"><a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage - 1)">«</a></li>
                          <li v-for="page in simplePaginationRange" :key="viewMode + '_' + page" class="page-item" :class="{ active: page === currentPagination.currentPage, disabled: page === '...' }"><a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a> <span v-else class="page-link">...</span></li>
                          <li class="page-item" :class="{ disabled: currentPagination.currentPage >= currentTotalPages }"><a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage + 1)">»</a></li>
                      </ul>
                  </nav>
              </div>

              <!-- ======================= -->
              <!-- MODAL TAMBAH/EDIT PRODUK-->
              <!-- ======================= -->
              <div v-if="showModal" class="modal-overlay" @click.self="closeAndResetModal">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                  <div class="modal-content shadow-lg">
                    <div class="modal-header"><h5 class="modal-title"><i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2']"></i>{{ isEditing ? 'Edit Produk' : 'Tambah Produk Baru' }}</h5><button type="button" class="btn-close" @click="closeAndResetModal"></button></div>
                    <div class="modal-body">
                      <div v-if="modalError" class="alert alert-danger alert-dismissible fade show"><div v-html="modalError"></div><button type="button" class="btn-close btn-sm" @click="modalError = null"></button></div>
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
                        <!-- Changed v-model to production_details -->
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
                               <!-- This select expects option.id to be the integer ID from the backend -->
                               <div v-for="(materialItem, index) in currentProduct.materials" :key="index" class="material-item-row row gx-2 mb-2 align-items-center">
                                   <div class="col-md-4">
                                       <select class="form-select form-select-sm" v-model="materialItem.material_id" required :disabled="isSaving">
                                           <option value="" disabled>Pilih Material...</option>
                                           <!-- Ensure option.id is the integer ID -->
                                           <option v-for="option in materialOptions" :key="option.id" :value="option.id">{{ option.text }}</option>
                                      </select>
                                  </div>
                                   <div class="col-md-2"><input type="number" class="form-control form-control-sm" v-model.number="materialItem.quantity_needed" placeholder="Qty" required min="0" step="any" :disabled="isSaving"/></div>
                                   <!-- Changed v-model to pivot_notes -->
                                   <div class="col-md-3"><input type="text" class="form-control form-control-sm" v-model="materialItem.pivot_notes" placeholder="Catatan (opsional, JSON)" :disabled="isSaving"/></div>
                                   <div class="col-auto"><div class="form-check form-check-inline pt-1"><input class="form-check-input" type="checkbox" :id="'critical_'+index" v-model="materialItem.is_critical" :disabled="isSaving"><label class="form-check-label small" :for="'critical_'+index">Kritis</label></div></div>
                                   <!-- Added Specification Approved At input - Type might need adjustment -->
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

              <!-- ======================= -->
              <!--     MODAL AUDIT         -->
              <!-- ======================= -->
              <div v-if="showAuditModal" class="modal-overlay" @click.self="closeAuditModal">
                <div class="modal-dialog modal-dialog-centered modal-xl">
                  <div class="modal-content shadow-lg">
                    <div class="modal-header"><h5 class="modal-title"><i class="fas fa-history me-2 text-info"></i>Riwayat Audit: <span class="fw-medium">{{ currentAuditedProduct.name }}</span><small class="d-block text-muted fw-normal">({{ currentAuditedProduct.uuid }})</small></h5><button type="button" class="btn-close" @click="closeAuditModal"></button></div>
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
                                          <!-- Displaying Audit Changes -->
                                          <div v-if="audit.event !== 'created'" class="audit-changes small">
                                              <!-- Iterate through NEW values to show changes -->
                                              <div v-for="(newValue, key) in audit.new_values" :key="'new_'+key">
                                                  <div v-if="formatAuditValue(audit.old_values?.[key]) !== formatAuditValue(newValue)">
                                                      <strong class="text-capitalize">{{ formatAuditKey(key) }}:</strong>
                                                      <span class="text-danger text-decoration-line-through me-1" v-html="formatAuditValue(audit.old_values?.[key])"></span>
                                                      <i class="fas fa-arrow-right fa-xs mx-1 text-muted"></i>
                                                      <span class="text-success" v-html="formatAuditValue(newValue)"></span>
                                                  </div>
                                              </div>
                                              <!-- Iterate through OLD values to show removed fields -->
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
                                              <!-- Display all values for 'created' event -->
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
                       <!-- Audit Pagination -->
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

          </div> <!-- End .product-manager-container -->
      </div> <!-- End .container -->
  </div> <!-- End .dashboard-view -->
</template>

<script setup>
/* eslint-disable no-unused-vars */
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';

// --- Axios Instance ---
const apiClient = axios.create({
baseURL: `${process.env.VUE_APP_API_URL || 'http://localhost:8000/api'}`,
headers: { 'Accept': 'application/json' }
});

// --- Axios Interceptors ---
apiClient.interceptors.request.use(config => {
try {
  const userDataString = localStorage.getItem('userData');
  if (userDataString) {
    const userData = JSON.parse(userDataString);
    const token = userData?.token;
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
} catch (e) { console.error("Error reading localStorage:", e); }
// Handle FormData correctly for file uploads
if (config.data instanceof FormData) {
  // Let the browser set the Content-Type for FormData
  delete config.headers['Content-Type'];
} else {
  // Set default Content-Type for other requests
  config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
}
return config;
}, error => Promise.reject(error));

apiClient.interceptors.response.use(response => response, error => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error(`Authentication Error (${error.response.status})`);
      localStorage.removeItem('userData');
      window.location.href = '/login'; // Redirect
      return Promise.reject(new Error(`Auth failed or forbidden: ${error.response.status}`));
  }
  // Keep other warnings for debugging
  if (error.response && error.response.status === 409) { console.warn('Conflict Error (409):', error.response.data?.message); }
  if (error.response && error.response.status === 404) { console.warn('Not Found Error (404):', error.response.data?.message); }
  if (error.response && error.response.status === 422) { console.warn('Validation Error (422):', error.response.data); }
  return Promise.reject(error);
});
// --- End Axios Setup ---

// --- Utility Function ---
// Helper to format keys for display (e.g., 'is_published' -> 'Is Published')
const formatDisplayKey = (key) => {
  if (key === 'is_published') return 'Status Publikasi';
  if (key === 'launch_date') return 'Tgl Launch';
  if (key === 'production_details') return 'Detail Produksi';
  if (key === 'attachment_path') return 'Lampiran';
  if (key === 'material_id') return 'ID Material';
  if (key === 'quantity_needed') return 'Kuantitas';
  if (key === 'is_critical') return 'Kritis';
  if (key === 'specification_approved_at') return 'Tgl Approv Spec';
  if (key === 'notes') return 'Catatan'; // For pivot notes
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => {
  if (error?.message?.includes('Auth failed or forbidden')) {
      return 'Sesi Anda mungkin telah berakhir atau Anda tidak memiliki izin. Silakan login kembali.';
  }
  if (error?.response) {
      let apiMessage = error.response.data?.message;
      const status = error.response.status;
      if (status === 422 && error.response.data?.errors) {
          // Format validation errors
          const errors = error.response.data.errors;
           const formattedErrors = Object.entries(errors).map(([key, value]) => {
               let prefix = '';
               let fieldName = key;
               // Handle nested material errors
               if (key.startsWith('materials.')) {
                   const parts = key.split('.');
                   if (parts.length === 3) {
                       const index = parseInt(parts[1], 10) + 1; // User-friendly index
                       fieldName = formatDisplayKey(parts[2]); // Format field name
                       prefix = `Material baris ${index} (${fieldName}): `;
                   } else {
                       // Fallback for unexpected material error format
                       fieldName = formatDisplayKey(key);
                   }
               } else {
                   fieldName = formatDisplayKey(key); // Format top-level field name
               }
               // Join multiple messages for the same field
               return `${prefix}${value.join(', ')}`;
           });
          apiMessage = formattedErrors.join('<br/> ');
          apiMessage = `Data tidak valid:<br/> ${apiMessage}`;
      }
      else if (status === 404) { apiMessage = apiMessage || 'Data tidak ditemukan.'; }
      else if (status === 403) { apiMessage = apiMessage || 'Anda tidak memiliki izin untuk melakukan aksi ini.'; }
      else if (status === 409) { apiMessage = apiMessage || 'Operasi gagal karena konflik data.'; }
      else if (status >= 500) {
          apiMessage = 'Terjadi masalah pada server.';
          console.error('Server Error (5xx):', error.response.data?.message, error.response.data?.error_details); // Log more details if available
      }

      return apiMessage || `Error ${status}: ${error.response.statusText || defaultMessage}`;
  } else if (error?.request) {
      return 'Tidak dapat terhubung ke server.';
  }
  return error?.message || defaultMessage;
};


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
// Renamed 'notes' to 'production_details' to match schema
const currentProduct = reactive({
  uuid: null,
  name: '',
  sku: '',
  description: '',
  production_details: '', // Changed from notes
  launch_date: null,
  is_published: false,
  attachment: null,
  attachment_path: null,
  remove_attachment_flag: false,
  // Updated materials array structure to include new pivot fields
  materials: [] // Array of { material_id: INT, quantity_needed: NUM, pivot_notes: JSON_STRING|NULL, is_critical: BOOL, specification_approved_at: DATETIME_STRING|NULL }
});
const attachmentPreviewUrl = ref(null);
const materialOptions = ref([]);
const isLoadingMaterialOptions = ref(false);
const isExporting = ref(false);
const exportMessage = ref(null);
// Audit Log State
const showAuditModal = ref(false);
const currentAuditedProduct = reactive({ uuid: null, name: '' });
const auditLog = ref([]);
const auditPagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 10 });
const isLoadingAudit = ref(false);
const auditError = ref(null);


// --- Computed Properties ---
const currentPagination = computed(() => viewMode.value === 'active' ? pagination.value : trashedPagination.value);
const currentTotalPages = computed(() => currentPagination.value.totalPages);
const currentTotalItems = computed(() => currentPagination.value.totalItems);
const trashedCountForDisplay = computed(() => trashedCount.value > 99 ? '99+' : trashedCount.value);
const hasActiveFilters = computed(() => filters.search || (viewMode.value === 'active' && (filters.published_status !== '' || filters.material_id !== '')));

const getSortIcon = (column) => {
  if (viewMode.value !== 'active' || filters.sort_by !== column) return 'fas fa-sort text-muted opacity-50';
  return filters.sort_direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
};

const simplePaginationRange = computed(() => {
  const current = currentPagination.value.currentPage;
  const last = currentTotalPages.value;
  if (!last || last <= 1) return last === 1 ? [1] : [];
  const delta = 1; const range = []; const rangeWithDots = []; let l;
  range.push(1); for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) { range.push(i); } if (last > 1) range.push(last);
  const uniqueRange = [...new Set(range)].sort((a, b) => a - b); uniqueRange.forEach((i) => { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l > 2) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; }); return rangeWithDots;
});

const simpleAuditPaginationRange = computed(() => {
  const current = auditPagination.value.currentPage;
  const last = auditPagination.value.totalPages;
   if (!last || last <= 1) return last === 1 ? [1] : [];
  const delta = 1; const range = []; const rangeWithDots = []; let l;
  range.push(1); for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) { range.push(i); } if (last > 1) range.push(last);
  const uniqueRange = [...new Set(range)].sort((a, b) => a - b); uniqueRange.forEach((i) => { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l > 2) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; }); return rangeWithDots;
});

const actionInProgress = (uuid) => deletingId.value === uuid || restoringId.value === uuid || forceDeletingId.value === uuid;

// Helper to construct public URL for attachments
const getPublicUrl = (path) => {
if (!path) return '#';
const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:8000';
const cleanBaseUrl = baseUrl.endsWith('/api') ? baseUrl.substring(0, baseUrl.length - 4) : baseUrl;
return `${cleanBaseUrl.replace(/\/$/, '')}/storage/${path}`;
};


// --- API Functions ---
async function fetchProducts() {
  isLoading.value = true;
  error.value = null;
  filters.page = pagination.value.currentPage;
  filters.per_page = parseInt(filters.per_page, 10);
  const queryParams = { ...filters };
  delete queryParams.page;
  delete queryParams.per_page;
  const activeFilters = Object.entries(queryParams).reduce((acc, [key, value]) => {
    if (value !== '' && value !== null) acc[key] = value;
    return acc;
  }, { page: filters.page, per_page: filters.per_page });

  try {
      const response = await apiClient.get('/products', { params: activeFilters });
      if (response.data && response.data.data) {
          products.value = response.data.data;
          pagination.value = {
              currentPage: response.data.meta?.current_page ?? 1,
              totalPages: response.data.meta?.last_page ?? 1,
              totalItems: response.data.meta?.total ?? 0,
              perPage: parseInt(response.data.meta?.per_page ?? filters.per_page, 10),
          };
           await fetchTrashCount();
      } else { products.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page }; }
  } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat data produk.');
      products.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page };
  } finally { isLoading.value = false; }
}

async function fetchTrashedProducts() {
  isLoading.value = true; error.value = null;
  const trashPage = trashedPagination.value.currentPage; const trashPerPage = parseInt(filters.per_page, 10);
  const params = { page: trashPage, per_page: trashPerPage, ...(filters.search && { search: filters.search }), };
  try {
      const response = await apiClient.get('/products/trash', { params });
       if (response.data && response.data.data) {
          trashedProducts.value = response.data.data;
          trashedPagination.value = { currentPage: response.data.meta?.current_page ?? 1, totalPages: response.data.meta?.last_page ?? 1, totalItems: response.data.meta?.total ?? 0, perPage: parseInt(response.data.meta?.per_page ?? trashPerPage, 10) };
          trashedCount.value = response.data.meta?.total ?? 0;
      } else { trashedProducts.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage }; trashedCount.value = 0; }
  } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat data produk dari tempat sampah.');
      trashedProducts.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage }; trashedCount.value = 0;
  } finally { isLoading.value = false; }
}

async function fetchTrashCount() {
  if (viewMode.value === 'active') {
    try { const response = await apiClient.get('/products/trash', { params: { per_page: 1 } }); trashedCount.value = response.data.meta?.total ?? 0; }
    catch (err) { console.error("Failed to fetch product trash count:", getErrorMessage(err)); }
  }
}

async function fetchMaterialOptions() {
  if (materialOptions.value.length > 0 && !isEditing.value) return;
  isLoadingMaterialOptions.value = true;
  try { const response = await apiClient.get('/material-options'); materialOptions.value = response.data || []; }
  catch (err) { console.error("Error fetching material options:", err); modalError.value = getErrorMessage(err, "Gagal memuat opsi material."); }
  finally { isLoadingMaterialOptions.value = false; }
}

async function saveProduct() {
  // Validation
  if (!currentProduct.name || !currentProduct.sku) { modalError.value = "Nama Produk dan SKU wajib diisi."; return; }
  if (currentProduct.production_details) { // Changed from notes
      try { JSON.parse(currentProduct.production_details); }
      catch (e) { modalError.value = "Format JSON pada Detail Produksi tidak valid."; return; }
  }
  const invalidMaterial = currentProduct.materials.some( m => !m.material_id || m.quantity_needed === '' || m.quantity_needed === null || isNaN(parseFloat(m.quantity_needed)) );
  if (invalidMaterial) { modalError.value = "Setiap baris material harus memiliki Material terpilih dan Kuantitas (Qty) yang valid (angka)."; return; }
  // Validate pivot notes if needed (optional, backend validates JSON)
   const invalidPivotNote = currentProduct.materials.some(m => {
       if (m.pivot_notes) { // Check only if notes are provided
           try { JSON.parse(m.pivot_notes); return false; } catch { return true; }
       } return false;
   });
   if (invalidPivotNote) { modalError.value = "Format JSON pada Catatan Material tidak valid."; return; }
    // Validate spec date format if needed (optional, backend validates date)
   const invalidSpecDate = currentProduct.materials.some(m => {
        if (m.specification_approved_at && isNaN(Date.parse(m.specification_approved_at))) {
             return true; // Invalid if provided and not parseable
        } return false;
   });
   if (invalidSpecDate) { modalError.value = "Format Tanggal Approval Spec Material tidak valid."; return; }


  isSaving.value = true; modalError.value = null; error.value = null;
  const formData = new FormData();
  formData.append('name', currentProduct.name);
  formData.append('sku', currentProduct.sku);
  formData.append('description', currentProduct.description || '');
  formData.append('production_details', currentProduct.production_details || ''); // Changed from notes
  formData.append('launch_date', currentProduct.launch_date || '');
  formData.append('is_published', currentProduct.is_published ? '1' : '0');
  if (currentProduct.attachment instanceof File) formData.append('attachment', currentProduct.attachment);
  if (isEditing.value && currentProduct.remove_attachment_flag) formData.append('remove_attachment', '1');

  // Append materials array with new pivot fields
  currentProduct.materials.forEach((item, index) => {
    if (item.material_id && item.quantity_needed !== '' && item.quantity_needed !== null) {
         formData.append(`materials[${index}][material_id]`, item.material_id);
         formData.append(`materials[${index}][quantity_needed]`, item.quantity_needed);
         // Use pivot_notes for the JSON pivot notes
         formData.append(`materials[${index}][notes]`, item.pivot_notes || ''); // Send empty string if null/empty
         formData.append(`materials[${index}][is_critical]`, item.is_critical ? '1' : '0');
         // Format date correctly before sending if needed, or rely on backend parsing
         formData.append(`materials[${index}][specification_approved_at]`, item.specification_approved_at || '');
    }
  });

  try {
      let response; const config = { };
      if (isEditing.value) { formData.append('_method', 'PUT'); response = await apiClient.post(`/products/${currentProduct.uuid}`, formData, config); }
      else { response = await apiClient.post('/products', formData, config); }

      if ((response.status === 200 || response.status === 201) && response.data?.data) {
          setSuccessMessage(`Produk "${response.data.data.name}" berhasil ${isEditing.value ? 'diperbarui' : 'ditambahkan'}.`);
          closeAndResetModal(); await fetchProducts();
      } else { throw new Error(response.data?.message || `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} produk.`); }
  } catch (err) { modalError.value = getErrorMessage(err, `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} produk.`); }
  finally { isSaving.value = false; }
}

async function deleteProduct(uuid, name) {
  deletingId.value = uuid; error.value = null; successMessage.value = null;
  try { const response = await apiClient.delete(`/products/${uuid}`);
      if (response.status === 204) {
          setSuccessMessage(`Produk "${name}" berhasil dipindahkan ke tempat sampah.`);
          if (products.value.length === 1 && pagination.value.currentPage > 1) pagination.value.currentPage--;
          await fetchProducts();
      } else { throw new Error(response.data?.message || 'Gagal menghapus produk.'); }
  } catch (err) { error.value = getErrorMessage(err, `Gagal memindahkan produk "${name}" ke tempat sampah.`); }
  finally { deletingId.value = null; }
}

async function restoreProduct(uuid, name) {
  restoringId.value = uuid; error.value = null; successMessage.value = null;
  try { const response = await apiClient.post(`/products/restore/${uuid}`);
      if (response.status === 200 && response.data?.message) {
          setSuccessMessage(response.data.message || `Produk "${name}" berhasil dipulihkan.`);
          if (trashedProducts.value.length === 1 && trashedPagination.value.currentPage > 1) trashedPagination.value.currentPage--;
          await fetchTrashedProducts();
      } else { throw new Error(response.data?.message || `Gagal memulihkan produk "${name}".`); }
  } catch (err) { error.value = getErrorMessage(err, `Gagal memulihkan produk "${name}".`); }
  finally { restoringId.value = null; }
}

async function forceDeleteProduct(uuid, name) {
  forceDeletingId.value = uuid; error.value = null; successMessage.value = null;
  const indexToDelete = trashedProducts.value.findIndex(p => p.uuid === uuid);
  try { const response = await apiClient.delete(`/products/force-delete/${uuid}`);
      if (response.status === 204) {
          setSuccessMessage(`Produk "${name}" berhasil dihapus permanen.`);
          if (indexToDelete > -1) trashedProducts.value.splice(indexToDelete, 1);
          const needsPageDecrement = trashedProducts.value.length === 0 && trashedPagination.value.currentPage > 1;
          if (needsPageDecrement) trashedPagination.value.currentPage--;
          await fetchTrashedProducts(); // Always re-fetch
      } else { throw new Error(response.data?.message || `Gagal menghapus produk "${name}" secara permanen.`); }
  } catch (err) { error.value = getErrorMessage(err, `Gagal menghapus produk "${name}" secara permanen.`); }
  finally { forceDeletingId.value = null; }
}

async function fetchAuditLog(productUuid, page = 1) {
  if (!productUuid) return;
  isLoadingAudit.value = true; auditError.value = null; const auditPerPage = auditPagination.value.perPage;
  try { const response = await apiClient.get(`/products/${productUuid}/audits`, { params: { page: page, per_page: auditPerPage } });
      if (response.data && response.data.data) {
          auditLog.value = response.data.data;
          auditPagination.value = { currentPage: response.data.meta?.current_page ?? 1, totalPages: response.data.meta?.last_page ?? 1, totalItems: response.data.meta?.total ?? 0, perPage: parseInt(response.data.meta?.per_page ?? auditPerPage, 10) };
      } else { auditLog.value = []; auditPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: auditPerPage }; }
  } catch (err) { auditError.value = getErrorMessage(err, 'Gagal memuat data audit.'); auditLog.value = []; auditPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: auditPerPage }; }
  finally { isLoadingAudit.value = false; }
}

async function triggerExport() {
  isExporting.value = true; exportMessage.value = "Mempersiapkan file export, mohon tunggu..."; error.value = null;
  try { const exportParams = { ...filters }; delete exportParams.page; delete exportParams.per_page;
      const cleanExportParams = Object.entries(exportParams).reduce((acc, [key, value]) => { if (value !== '' && value !== null) acc[key] = value; return acc; }, {});
      const response = await apiClient.get('/products/export', { params: cleanExportParams, responseType: 'blob', });

      // --- Manual Blob Handling ---
      if (response.status === 200 && response.data instanceof Blob && response.headers['content-disposition']) {
           const header = response.headers['content-disposition']; const filename = header ? header.split('filename=')[1].replace(/"/g, '') : 'products_export.xlsx';
           const url = window.URL.createObjectURL(response.data); const link = document.createElement('a');
           link.href = url; link.setAttribute('download', filename); document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
           exportMessage.value = `Export (${filename}) berhasil diunduh.`; setTimeout(() => { exportMessage.value = null; }, 5000); return;
      } else if (response.status === 202) { exportMessage.value = response.data.message || 'Proses export produk telah dimulai...'; setTimeout(() => { exportMessage.value = null; }, 7000); return; }
      else { let errorMsg = 'Gagal mengunduh file export.'; try { const errorData = JSON.parse(await response.data.text()); errorMsg = errorData.message || errorMsg; } catch { /* ignore */ } throw new Error(errorMsg); }
  } catch(err) {
       if (err.response && err.response.data instanceof Blob && err.response.headers['content-type']?.includes('application/json')) {
            try { const errorJson = JSON.parse(await err.response.data.text()); error.value = errorJson.message || 'Gagal membuat file export (server error).'; }
            catch (parseError) { error.value = 'Gagal membaca pesan error dari server.'; }
       } else { error.value = getErrorMessage(err, 'Gagal memulai atau mengunduh proses export.'); }
       exportMessage.value = null; // Clear pending message on error
  } finally { isExporting.value = false; if (exportMessage.value === "Mempersiapkan file export, mohon tunggu...") exportMessage.value = null; }
}

// --- UI Functions ---
function applyFilters() { clearError(); if (viewMode.value === 'active') { pagination.value.currentPage = 1; fetchProducts(); } else { trashedPagination.value.currentPage = 1; fetchTrashedProducts(); } }
function clearSearch() { if(filters.search) { filters.search = ''; applyFilters(); } }
function clearAllFilters() { filters.search = ''; filters.published_status = ''; filters.material_id = ''; applyFilters(); }
function clearError() { error.value = null; }
function setSuccessMessage(message) { successMessage.value = message; setTimeout(() => { successMessage.value = null; }, 4000); }
function changePage(page) { if (isLoading.value || page === '...') return; clearError(); if (viewMode.value === 'active') { if (page >= 1 && page <= pagination.value.totalPages && page !== pagination.value.currentPage) { pagination.value.currentPage = page; fetchProducts(); } } else { if (page >= 1 && page <= trashedPagination.value.totalPages && page !== trashedPagination.value.currentPage) { trashedPagination.value.currentPage = page; fetchTrashedProducts(); } } }
function changeSort(column) { if (viewMode.value !== 'active' || isLoading.value) return; clearError(); if (filters.sort_by === column) filters.sort_direction = filters.sort_direction === 'asc' ? 'desc' : 'asc'; else { filters.sort_by = column; filters.sort_direction = 'asc'; } applyFilters(); }
function openAddModal() {
  isEditing.value = false; modalError.value = null;
  Object.assign(currentProduct, { uuid: null, name: '', sku: '', description: '', production_details: '', launch_date: null, is_published: false, attachment: null, attachment_path: null, remove_attachment_flag: false, materials: [] });
  attachmentPreviewUrl.value = null; fetchMaterialOptions(); showModal.value = true;
}
function openEditModal(product) {
  isEditing.value = true; modalError.value = null;
  // Ensure production_details is a string for textarea binding, or handle null/object
  let prodDetails = product.production_details;
  if (prodDetails && typeof prodDetails === 'object') {
      try { prodDetails = JSON.stringify(prodDetails, null, 2); } // Pretty print for readability
      catch { prodDetails = ''; } // Fallback if stringify fails
  } else if (prodDetails === null || typeof prodDetails === 'undefined') {
      prodDetails = '';
  }

  Object.assign(currentProduct, {
      uuid: product.uuid, name: product.name, sku: product.sku, description: product.description || '',
      production_details: prodDetails || '', // Use formatted or empty string
      launch_date: product.launch_date ? product.launch_date.substring(0, 10) : null,
      is_published: product.is_published, attachment: null, attachment_path: product.attachment_path, remove_attachment_flag: false,
      // Map materials, ensuring pivot notes is handled correctly
      materials: product.materials ? product.materials.map(mat => {
           let pivotNotes = mat.pivot?.notes ?? null;
           // If pivot notes from backend is object/array, stringify it for textarea
           if (pivotNotes && typeof pivotNotes === 'object') {
               try { pivotNotes = JSON.stringify(pivotNotes); } catch { pivotNotes = ''; }
           } else if (pivotNotes === null || typeof pivotNotes === 'undefined') {
                pivotNotes = '';
           }
           return {
                material_id: mat.id, // Use integer ID
                quantity_needed: mat.pivot?.quantity_needed ?? '',
                pivot_notes: pivotNotes || '', // Bind textarea to string
                is_critical: mat.pivot?.is_critical ?? false,
                specification_approved_at: mat.pivot?.specification_approved_at ? mat.pivot.specification_approved_at.substring(0, 16).replace('T', ' ') : null // Format for datetime-local
           };
       }) : []
  });

  attachmentPreviewUrl.value = null; fetchMaterialOptions(); showModal.value = true;
}

function closeAndResetModal() {
  showModal.value = false; isEditing.value = false; modalError.value = null;
  Object.assign(currentProduct, { uuid: null, name: '', sku: '', description: '', production_details: '', launch_date: null, is_published: false, attachment: null, attachment_path: null, remove_attachment_flag: false, materials: [] });
  attachmentPreviewUrl.value = null; const fileInput = document.getElementById('productAttachment'); if(fileInput) fileInput.value = '';
}
function confirmDeleteProduct(uuid, name) { if (confirm(`Apakah Anda yakin ingin memindahkan produk "${name}" ke tempat sampah?`)) deleteProduct(uuid, name); }
function confirmForceDeleteProduct(uuid, name) { if (confirm(`PERHATIAN!\nApakah Anda yakin ingin menghapus produk "${name}" secara permanen?\nTindakan ini tidak dapat diurungkan.`)) forceDeleteProduct(uuid, name); }
function addMaterialRow() { currentProduct.materials.push({ material_id: '', quantity_needed: '', pivot_notes: '', is_critical: false, specification_approved_at: null }); }
function removeMaterialRow(index) { currentProduct.materials.splice(index, 1); }
function handleFileChange(event) {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') { currentProduct.attachment = file; currentProduct.remove_attachment_flag = false; if (attachmentPreviewUrl.value) URL.revokeObjectURL(attachmentPreviewUrl.value); attachmentPreviewUrl.value = URL.createObjectURL(file); modalError.value = null; }
  else { currentProduct.attachment = null; if (attachmentPreviewUrl.value) URL.revokeObjectURL(attachmentPreviewUrl.value); attachmentPreviewUrl.value = null; if (file) { modalError.value = "Hanya file PDF yang diperbolehkan."; event.target.value = ''; } }
}
function removeAttachment() { currentProduct.attachment = null; currentProduct.attachment_path = null; currentProduct.remove_attachment_flag = true; if (attachmentPreviewUrl.value) URL.revokeObjectURL(attachmentPreviewUrl.value); attachmentPreviewUrl.value = null; const fileInput = document.getElementById('productAttachment'); if (fileInput) fileInput.value = ''; }
function openAuditModal(product) { currentAuditedProduct.uuid = product.uuid; currentAuditedProduct.name = product.name; auditLog.value = []; auditError.value = null; auditPagination.value.currentPage = 1; showAuditModal.value = true; fetchAuditLog(product.uuid, 1); }
function closeAuditModal() { showAuditModal.value = false; }
function changeAuditPage(page) { if (isLoadingAudit.value || page === '...') return; if (page >= 1 && page <= auditPagination.value.totalPages && page !== auditPagination.value.currentPage) { auditPagination.value.currentPage = page; fetchAuditLog(currentAuditedProduct.uuid, page); } }
function switchViewMode(mode) { if (mode === viewMode.value || isLoading.value) return; viewMode.value = mode; clearError(); successMessage.value = null; filters.search = ''; if (mode === 'active') { filters.published_status = ''; filters.material_id = ''; pagination.value.currentPage = 1; fetchProducts(); } else { trashedPagination.value.currentPage = 1; fetchTrashedProducts(); } }

// --- Utilities for Display ---
const formatDateShort = (dateString) => { if (!dateString) return '-'; try { return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return dateString; } }
const formatDate = (dateString) => { if (!dateString) return '-'; try { return new Date(dateString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false }); } catch (e) { return dateString; } };
const formatAuditKey = formatDisplayKey;
const formatAuditValue = (value) => {
  if (value === null || typeof value === 'undefined') return '<span class="text-muted">[Kosong]</span>';
  if (typeof value === 'boolean') return value ? '<span class="text-success">Published</span>' : '<span class="text-secondary">Draft</span>'; // Or Ya/Tidak
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}:\d{2}/.test(value)) { return formatDate(value); }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) { return formatDateShort(value); }
  if (typeof value === 'string' && value.length > 150) { return value.substring(0, 150) + '...'; }
  if (typeof value === 'object') { try { return `<pre class="audit-json">${JSON.stringify(value, null, 2)}</pre>`; } catch { return '[Object]'; } }
  return value;
};

onMounted(() => { fetchProducts(); });

</script>

