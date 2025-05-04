<template>
    <div class="dashboard-view">
      <div class="container">
        <div class="material-manager-container">

          <!-- Page Header -->
          <header class="page-header">
            <h1 class="page-title">Manajemen Material</h1>
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
              <!-- Add Button (only for active view) -->
              <button v-if="viewMode === 'active'" @click="openAddModal" class="btn btn-primary btn-sm">
                <i class="fas fa-plus me-1"></i> Tambah Material Baru
              </button>
            </div>
          </header>

          <!-- Filters Section -->
          <div class="filter-section card shadow-sm mb-4">
            <div class="card-body d-flex flex-column flex-md-row flex-wrap gap-3 align-items-md-center">
              <!-- Search Input -->
              <div class="filter-item flex-grow-1 mb-2 mb-md-0" style="min-width: 200px;">
                <label for="searchFilterMaterial" class="form-label visually-hidden">Cari Material</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-light"><i class="fas fa-search fa-fw"></i></span>
                  <input type="text" id="searchFilterMaterial" class="form-control"
                         :placeholder="`Cari nama di ${viewMode === 'active' ? 'daftar aktif' : 'tempat sampah'}...`"
                         v-model.lazy="filters.search" @keyup.enter="applyFilters" :disabled="isLoading" />
                  <button v-if="filters.search" class="btn btn-outline-secondary" type="button"
                          @click="clearSearch" title="Hapus Pencarian">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <!-- Status Filter (Only for Active View) -->
              <div v-if="viewMode === 'active'" class="filter-item" style="min-width: 150px;">
                <label for="statusFilterMaterial" class="form-label visually-hidden">Filter Status</label>
                <select id="statusFilterMaterial" class="form-select form-select-sm"
                        v-model="filters.status" @change="applyFilters" :disabled="isLoading">
                  <option value="">Semua Status</option>
                  <option value="true">Aktif</option>
                  <option value="false">Tidak Aktif</option>
                </select>
              </div>
              <!-- Apply & Clear Buttons -->
              <div class="filter-item ms-md-auto">
                <button class="btn btn-sm btn-primary" @click="applyFilters" :disabled="isLoading">
                  <i class="fas fa-filter me-1"></i> Terapkan
                </button>
                <button v-if="hasActiveFilters" class="btn btn-sm btn-outline-secondary ms-2"
                        @click="clearAllFilters" :disabled="isLoading" title="Hapus Semua Filter">
                  <i class="fas fa-eraser"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Feedback Section -->
          <div class="feedback-section mb-3" aria-live="polite">
              <!-- Loading Indicator -->
              <div v-if="isLoading && (viewMode === 'active' ? isActiveListEmpty : isTrashedListEmpty)" class="alert alert-info d-flex align-items-center shadow-sm" role="status">
                  <div class="spinner-border spinner-border-sm me-3" aria-hidden="true"></div>
                  <span>Memuat data material{{ viewMode === 'trashed' ? ' sampah' : '' }}...</span>
              </div>
              <!-- Error Message -->
              <div v-if="error && !showModal && !showAuditModal && !confirmationState.show" class="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
                  <i class="fas fa-exclamation-triangle me-2"></i> <span v-html="error"></span>
                  <button type="button" class="btn-close btn-sm" @click="clearError" aria-label="Close"></button>
              </div>
              <!-- Success Message -->
              <div v-if="successMessage" class="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                  <i class="fas fa-check-circle me-2"></i> {{ successMessage }}
                  <button type="button" class="btn-close btn-sm" @click="successMessage = null" aria-label="Close"></button>
              </div>
              <!-- No Data Message -->
              <div v-if="!isLoading && (viewMode === 'active' ? isActiveListEmpty : isTrashedListEmpty) && !error" class="alert alert-secondary text-center shadow-sm">
                  <i class="fas fa-box-open me-2 opacity-50"></i>
                  Tidak ada material ditemukan
                  <span v-if="hasActiveFilters"> untuk filter yang diterapkan</span>
                  <span v-else-if="viewMode === 'active'">.</span>
                  <span v-else-if="viewMode === 'trashed'"> di tempat sampah.</span>
                  <button v-if="viewMode === 'active' && !hasActiveFilters" @click="openAddModal" class="btn btn-sm btn-link p-0 ms-2">Tambah Material Baru</button>
                  <button v-if="hasActiveFilters" @click="clearAllFilters" class="btn btn-sm btn-link p-0 ms-2">Hapus Filter</button>
              </div>
          </div>

          <!-- ======================= -->
          <!--      ACTIVE TABLE       -->
          <!-- ======================= -->
          <div v-if="viewMode === 'active'" class="table-container shadow-sm mb-4">
            <div class="table-responsive">
              <table class="table table-hover align-middle modern-table" :aria-busy="isLoading">
                <thead>
                  <tr>
                    <th scope="col" style="width: 5%;">#</th>
                    <th scope="col" @click="changeSort('name')" class="sortable-header" :aria-sort="getAriaSort('name')">
                      Nama Material <i :class="getSortIcon('name')"></i>
                    </th>
                    <th scope="col" style="width: 20%;">Deskripsi</th>
                    <th scope="col" style="width: 20%;">Info Supplier</th>
                    <th scope="col" style="width: 10%;" @click="changeSort('is_active')" class="sortable-header" :aria-sort="getAriaSort('is_active')">
                      Status <i :class="getSortIcon('is_active')"></i>
                    </th>
                    <th scope="col" style="width: 15%;" @click="changeSort('created_at')" class="sortable-header" :aria-sort="getAriaSort('created_at')">
                      Dibuat Pada <i :class="getSortIcon('created_at')"></i>
                    </th>
                    <th scope="col" class="text-center" style="width: 15%;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoading && isActiveListEmpty">
                    <td colspan="7" class="text-center">
                      <div class="d-flex justify-content-center align-items-center py-4">
                        <div class="spinner-border text-primary" role="status"></div>
                        <span class="ms-3 text-muted">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="(material, index) in materials" :key="material.uuid" v-show="!isLoading || !isActiveListEmpty">
                    <td>{{ (pagination.currentPage - 1) * pagination.perPage + index + 1 }}</td>
                    <td class="fw-medium">{{ material.name }}</td>
                    <td class="text-muted small">{{ material.description || '-' }}</td>
                    <td>
                        <div v-if="parsedSupplierInfo(material.supplier_info).name || parsedSupplierInfo(material.supplier_info).contact"
                             class="small supplier-info">
                            <span v-if="parsedSupplierInfo(material.supplier_info).name" class="d-block text-truncate" :title="parsedSupplierInfo(material.supplier_info).name">
                                <i class="fas fa-building fa-fw me-1 text-muted"></i> {{ parsedSupplierInfo(material.supplier_info).name }}
                            </span>
                            <span v-if="parsedSupplierInfo(material.supplier_info).contact" class="d-block text-truncate" :title="parsedSupplierInfo(material.supplier_info).contact">
                                <i class="fas fa-phone-alt fa-fw me-1 text-muted"></i> {{ parsedSupplierInfo(material.supplier_info).contact }}
                            </span>
                        </div>
                        <span v-else class="text-muted small">-</span>
                    </td>
                    <td>
                      <span :class="['badge', material.is_active ? 'bg-success-light text-success' : 'bg-secondary-light text-secondary']">
                        {{ material.is_active ? 'Aktif' : 'Tidak Aktif' }}
                      </span>
                    </td>
                    <td>{{ formatDate(material.created_at) }}</td>
                    <td>
                      <div class="action-buttons">
                        <button @click="openEditModal(material)"
                                class="btn btn-icon btn-outline-primary" title="Edit Material"
                                :disabled="actionInProgress(material.uuid)">
                          <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button @click="openAuditModal(material)"
                                class="btn btn-icon btn-outline-info" title="Lihat Riwayat Perubahan"
                                :disabled="actionInProgress(material.uuid) || isAuditLoading">
                          <i class="fas fa-history"></i>
                        </button>
                        <button @click="askConfirmDeleteMaterial(material.uuid, material.name)"
                                class="btn btn-icon btn-outline-danger" title="Pindahkan ke Tempat Sampah"
                                :disabled="actionInProgress(material.uuid)">
                          <span v-if="deletingId === material.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div> <!-- End Active Table Container -->

          <!-- ======================= -->
          <!--      TRASHED TABLE      -->
          <!-- ======================= -->
          <div v-if="viewMode === 'trashed'" class="table-container shadow-sm mb-4">
            <div class="table-responsive">
              <table class="table table-hover align-middle modern-table" :aria-busy="isLoading">
                <thead>
                  <tr>
                    <th scope="col" style="width: 5%;">#</th>
                    <th scope="col">Nama Material</th>
                    <th scope="col" style="width: 20%;">Deskripsi</th>
                    <th scope="col" style="width: 20%;">Info Supplier</th>
                    <th scope="col" style="width: 20%;">Dihapus Pada</th>
                    <th scope="col" class="text-center" style="width: 15%;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoading && isTrashedListEmpty">
                    <td colspan="6" class="text-center">
                      <div class="d-flex justify-content-center align-items-center py-4">
                        <div class="spinner-border text-primary" role="status"></div>
                        <span class="ms-3 text-muted">Memuat data sampah...</span>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="(material, index) in trashedMaterials" :key="material.uuid" v-show="!isLoading || !isTrashedListEmpty">
                    <td>{{ (trashedPagination.currentPage - 1) * trashedPagination.perPage + index + 1 }}</td>
                    <td class="fw-medium">{{ material.name }}</td>
                    <td class="text-muted small">{{ material.description || '-' }}</td>
                     <td>
                        <div v-if="parsedSupplierInfo(material.supplier_info).name || parsedSupplierInfo(material.supplier_info).contact"
                             class="small supplier-info">
                            <span v-if="parsedSupplierInfo(material.supplier_info).name" class="d-block text-truncate" :title="parsedSupplierInfo(material.supplier_info).name">
                                <i class="fas fa-building fa-fw me-1 text-muted"></i> {{ parsedSupplierInfo(material.supplier_info).name }}
                            </span>
                            <span v-if="parsedSupplierInfo(material.supplier_info).contact" class="d-block text-truncate" :title="parsedSupplierInfo(material.supplier_info).contact">
                                <i class="fas fa-phone-alt fa-fw me-1 text-muted"></i> {{ parsedSupplierInfo(material.supplier_info).contact }}
                            </span>
                        </div>
                        <span v-else class="text-muted small">-</span>
                    </td>
                    <td>{{ formatDate(material.deleted_at) }}</td>
                    <td>
                      <div class="action-buttons">
                        <button @click="restoreMaterial(material.uuid, material.name)"
                                class="btn btn-icon btn-outline-success" title="Pulihkan Material"
                                :disabled="actionInProgress(material.uuid)">
                          <span v-if="restoringId === material.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-undo-alt"></i>
                        </button>
                        <button @click="askConfirmForceDeleteMaterial(material.uuid, material.name)"
                                class="btn btn-icon btn-outline-danger" title="Hapus Permanen"
                                :disabled="actionInProgress(material.uuid)">
                          <span v-if="forceDeletingId === material.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-times-circle"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div> <!-- End Trashed Table Container -->

          <!-- Pagination -->
          <div v-if="!isLoading && currentTotalPages > 1" class="pagination-controls d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
              <!-- Per Page Selector -->
              <div class="d-flex align-items-center gap-2">
                  <label :for="'perPageSelectMaterial'+viewMode" class="form-label mb-0 text-muted small">Item/Hal:</label>
                  <select :id="'perPageSelectMaterial'+viewMode" class="form-select form-select-sm" style="width: 75px;"
                          v-model="filters.per_page" @change="applyFilters">
                      <option value="15">15</option> <option value="25">25</option> <option value="50">50</option> <option value="100">100</option>
                  </select>
                  <span class="text-muted small ms-2 d-none d-md-inline">
                      Total {{ currentTotalItems }} material{{ viewMode === 'trashed' ? ' sampah' : ''}}
                  </span>
              </div>
              <!-- Page Links -->
              <nav aria-label="Page navigation">
                   <ul class="pagination pagination-sm mb-0">
                     <li class="page-item" :class="{ disabled: currentPagination.currentPage <= 1 }">
                       <a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage - 1)" aria-label="Previous">
                         <span aria-hidden="true">«</span>
                       </a>
                     </li>
                     <li v-for="page in simplePaginationRange" :key="viewMode+'_page_'+page" class="page-item"
                         :class="{ active: page === currentPagination.currentPage, disabled: page === '...' }"
                         :aria-current="page === currentPagination.currentPage ? 'page' : null">
                       <a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                       <span v-else class="page-link" aria-hidden="true">...</span>
                     </li>
                     <li class="page-item" :class="{ disabled: currentPagination.currentPage >= currentTotalPages }">
                       <a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage + 1)" aria-label="Next">
                         <span aria-hidden="true">»</span>
                       </a>
                     </li>
                   </ul>
              </nav>
          </div> <!-- End Pagination -->

          <!-- ========================== -->
          <!-- ADD/EDIT MATERIAL MODAL    -->
          <!-- ========================== -->
          <div v-if="showModal" class="modal-overlay" @click.self="closeAndResetModal">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content shadow-lg">
                <div class="modal-header">
                  <h5 class="modal-title">
                    <i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2']"></i>
                    {{ isEditing ? 'Edit Material' : 'Tambah Material Baru' }}
                  </h5>
                  <button type="button" class="btn-close" @click="closeAndResetModal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <div v-if="modalError" class="alert alert-danger alert-dismissible fade show" role="alert">
                    <span v-html="modalError"></span> <!-- Allow HTML for potential list errors -->
                    <button type="button" class="btn-close btn-sm" @click="modalError = null" aria-label="Close"></button>
                  </div>
                  <form @submit.prevent="saveMaterial" id="materialForm" class="modern-form" novalidate>
                    <!-- Name Field -->
                    <div class="form-group mb-3">
                      <label for="materialName" class="form-label">Nama Material <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="materialName" v-model.trim="currentMaterial.name"
                             required placeholder="Masukkan nama material" :disabled="isSaving" />
                    </div>
                    <!-- Status Field -->
                    <div class="form-group mb-3">
                      <label class="form-label d-block">Status</label>
                      <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="materialStatus"
                               v-model="currentMaterial.is_active" :disabled="isSaving">
                        <label class="form-check-label" for="materialStatus">
                          {{ currentMaterial.is_active ? 'Aktif' : 'Tidak Aktif' }}
                        </label>
                      </div>
                      <small class="form-text text-muted">
                        Material yang tidak aktif tidak akan muncul di pilihan saat membuat produk.
                      </small>
                    </div>
                    <!-- Description Field -->
                    <div class="form-group mb-3">
                      <label for="materialDescription" class="form-label">Deskripsi</label>
                      <textarea class="form-control" id="materialDescription" rows="3"
                                v-model="currentMaterial.description"
                                placeholder="Deskripsi atau catatan tambahan (opsional)"
                                :disabled="isSaving"></textarea>
                    </div>
                    <!-- Supplier Info Fields -->
                    <fieldset class="border p-3 rounded mb-3">
                        <legend class="fs-6 px-2 w-auto">Informasi Supplier (Opsional)</legend>
                        <div class="form-group mb-3">
                            <label for="supplierName" class="form-label">Nama Supplier</label>
                            <input type="text" class="form-control form-control-sm" id="supplierName"
                                   v-model.trim="currentMaterial.supplier_name"
                                   placeholder="Nama perusahaan/kontak person" :disabled="isSaving" />
                        </div>
                        <div class="form-group mb-0"> <!-- mb-0 for last item in fieldset -->
                            <label for="supplierContact" class="form-label">Kontak Supplier</label>
                            <input type="text" class="form-control form-control-sm" id="supplierContact"
                                   v-model.trim="currentMaterial.supplier_contact"
                                   placeholder="Nomor telepon atau email" :disabled="isSaving" />
                        </div>
                    </fieldset>
                  </form>
                </div> <!-- End modal-body -->
                <div class="modal-footer">
                  <button type="button" class="btn btn-outline-secondary" @click="closeAndResetModal" :disabled="isSaving">Batal</button>
                  <button type="submit" form="materialForm" class="btn btn-primary" :disabled="isSaveDisabled">
                    <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {{ isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Material') }}
                  </button>
                </div>
              </div> <!-- End .modal-content -->
            </div> <!-- End .modal-dialog -->
          </div> <!-- End Add/Edit Modal -->

          <!-- ======================= -->
          <!--     AUDIT LOG MODAL     -->
          <!-- ======================= -->
          <div v-if="showAuditModal" class="modal-overlay" @click.self="closeAuditModal">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div class="modal-content shadow-lg">
                <div class="modal-header">
                  <h5 class="modal-title">
                    <i class="fas fa-history me-2"></i>
                    Riwayat Perubahan: {{ auditedMaterialName }}
                  </h5>
                  <button type="button" class="btn-close" @click="closeAuditModal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <div v-if="isAuditLoading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 mb-0 text-muted">Memuat riwayat...</p>
                  </div>
                  <div v-else-if="auditError" class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i> {{ auditError }}
                  </div>
                  <div v-else-if="!auditLogs || auditLogs.length === 0" class="alert alert-secondary text-center" role="alert">
                    <i class="fas fa-info-circle me-2"></i> Belum ada riwayat perubahan untuk material ini.
                  </div>
                  <div v-else class="audit-log-list table-responsive">
                    <table class="table table-sm table-bordered table-striped small align-middle">
                      <thead class="table-light sticky-top">
                        <tr>
                          <th style="width: 15%;">Tanggal</th>
                          <th style="width: 15%;">Pengguna</th>
                          <th style="width: 10%;">Aksi</th>
                          <th>Detail Perubahan</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="log in auditLogs" :key="log.id">
                          <td>{{ formatAuditTimestamp(log.created_at) }}</td>
                           <td>
                                <span :title="log.user ? `ID: ${log.user.id}` : ''">{{ log.user?.name || 'Sistem/Tidak Diketahui' }}</span>
                           </td>
                          <td class="text-center">
                            <span :class="['badge', auditEventBadgeClass(log.event)]">
                              {{ formatAuditEvent(log.event) }}
                            </span>
                          </td>
                          <td class="changes-cell">
                            <div v-if="log.event === 'created'">
                              <span class="text-success fw-medium">Material Dibuat</span>
                              <ul class="list-unstyled mb-0 mt-1 small text-muted">
                                <li v-for="(value, key) in log.new_values" :key="key">
                                  <strong>{{ formatFieldName(key) }}:</strong>
                                  <span v-html="formatAuditValue(value)"></span>
                                </li>
                              </ul>
                            </div>
                             <ul v-else-if="log.event === 'updated' && Object.keys(log.new_values || {}).length > 0" class="list-unstyled mb-0">
                                <li v-for="(newValue, key) in log.new_values" :key="key">
                                    <strong>{{ formatFieldName(key) }}:</strong>
                                    <span class="change-value old-value text-danger text-decoration-line-through me-1" v-html="formatAuditValue(log.old_values ? log.old_values[key] : undefined)"></span>
                                    <i class="fas fa-arrow-right fa-fw mx-1 text-muted small"></i>
                                    <span class="change-value new-value text-success" v-html="formatAuditValue(newValue)"></span>
                                </li>
                            </ul>
                            <span v-else-if="log.event === 'deleted'" class="text-danger">
                              Material dipindahkan ke tempat sampah.
                            </span>
                            <span v-else-if="log.event === 'restored'" class="text-info">
                              Material dipulihkan dari tempat sampah.
                            </span>
                             <span v-else-if="log.event === 'forceDeleted'" class="text-danger fw-bold">
                                Material dihapus permanen.
                             </span>
                            <span v-else class="text-muted">{{ log.event }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-outline-secondary" @click="closeAuditModal">Tutup</button>
                </div>
              </div>
            </div>
          </div> <!-- End Audit Log Modal -->

          <!-- ======================= -->
          <!--   CONFIRMATION MODAL    -->
          <!-- ======================= -->
          <div v-if="confirmationState.show" class="modal-overlay" @click.self="cancelConfirmation">
              <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content shadow-lg">
                      <div class="modal-header" :class="confirmationState.type === 'forceDelete' ? 'bg-danger text-white' : 'bg-warning'">
                          <h5 class="modal-title">
                             <i class="fas fa-exclamation-triangle me-2"></i> Konfirmasi Tindakan
                          </h5>
                          <button type="button" class="btn-close" :class="confirmationState.type === 'forceDelete' ? 'btn-close-white' : ''" @click="cancelConfirmation" aria-label="Close"></button>
                      </div>
                      <div class="modal-body">
                          <p v-html="confirmationState.message"></p>
                          <p v-if="confirmationState.itemName" class="fw-bold text-center my-3 fs-5">
                             "{{ confirmationState.itemName }}"
                          </p>
                           <div v-if="confirmationState.type === 'forceDelete'" class="alert alert-danger d-flex align-items-center mt-3">
                              <i class="fas fa-skull-crossbones fs-4 me-3"></i>
                              <div><strong>PERHATIAN:</strong> Tindakan ini bersifat permanen dan TIDAK DAPAT DIURUNGKAN!</div>
                          </div>
                           <div v-if="confirmationState.type === 'delete'" class="alert alert-warning d-flex align-items-center mt-3">
                              <i class="fas fa-info-circle fs-4 me-3"></i>
                              <div>Material akan dipindahkan ke tempat sampah dan dapat dipulihkan nanti. Periksa penggunaan material ini pada Produk atau Bill of Materials.</div>
                          </div>
                      </div>
                      <div class="modal-footer justify-content-center">
                          <button type="button" class="btn btn-secondary px-4" @click="cancelConfirmation">Batal</button>
                          <button type="button" class="btn px-4" :class="confirmationState.type === 'forceDelete' ? 'btn-danger' : 'btn-warning'" @click="confirmAction">
                             Ya, Lanjutkan
                          </button>
                      </div>
                  </div>
              </div>
          </div> <!-- End Confirmation Modal -->

        </div> <!-- End .material-manager-container -->
      </div> <!-- End .container -->
    </div> <!-- End .dashboard-view -->
  </template>


<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import axios from 'axios';

// --- Axios Instance Setup ---
const apiClient = axios.create({
    baseURL: `${process.env.VUE_APP_API_URL || 'http://localhost:8000/api'}`, // Ensure /api path
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    timeout: 15000,
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
    } catch (e) { console.error("Error reading token from localStorage:", e); }
    return config;
}, error => Promise.reject(error));

apiClient.interceptors.response.use(response => response, error => {
    const config = error.config;
    if (error.response && (error.response.status === 401 || error.response.status === 403) && config?.method !== 'get') {
        console.error(`Authorization Error (${error.response.status}) on ${config.method?.toUpperCase()} ${config.url}`);
        if (error.response.status === 401) {
            localStorage.removeItem('userData');
            // Optional: Redirect or let component show message
            // window.location.href = '/login';
        }
        return Promise.reject(new Error(`Auth failed or forbidden: ${error.response.status}`));
    }
    // Optional: Log other specific errors if needed
    // if (error.response && error.response.status === 409) { console.warn('Conflict Error (409):', error.response.data?.message); }
    // if (error.response && error.response.status === 404) { console.warn('Not Found Error (404):', error.response.data?.message); }
    return Promise.reject(error);
});
// --- End Axios Setup ---

// --- Utility Function for Error Messages ---
const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => {
     if (error?.message?.startsWith('Auth failed or forbidden')) {
        const status = error.message.split(': ')[1];
        return `Sesi Anda mungkin telah berakhir (${status}) atau Anda tidak memiliki izin. Silakan login kembali.`;
    }
    if (error?.response) {
        const status = error.response.status;
        let apiMessage = error.response.data?.message;
        const apiErrors = error.response.data?.errors;
        if (status === 422 && apiErrors) {
            apiMessage = Object.values(apiErrors).flat().join('<br/> '); // Show all validation errors
             apiMessage = `Data tidak valid:<br/> ${apiMessage}`;
        } else if (status === 404) {
            apiMessage = apiMessage || 'Data tidak ditemukan.';
        } else if (status === 403) {
             apiMessage = apiMessage || 'Anda tidak memiliki izin untuk melakukan aksi ini.';
        } else if (status === 409) {
           apiMessage = apiMessage || 'Operasi gagal: Material ini mungkin masih digunakan dalam Produk/BOM atau terdapat konflik data lain.';
        } else if (status >= 500) {
           apiMessage = 'Terjadi masalah pada server (5xx). Coba lagi nanti.';
           console.error("Server Error Detail:", error.response.data);
        } else if (status === 401) {
             apiMessage = apiMessage || 'Autentikasi gagal (401). Silakan login kembali.';
        }
        return apiMessage || `Error ${status}: ${defaultMessage}`;
    } else if (error?.request) { return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'; }
    else { return error?.message || defaultMessage; }
};


// --- Component State ---
const viewMode = ref('active');
const materials = ref([]);
const trashedMaterials = ref([]);
const pagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedPagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedCount = ref(0);
const filters = reactive({ search: '', status: '', sort_by: 'created_at', sort_direction: 'desc', page: 1, per_page: 15 });
const isLoading = ref(false);
const isSaving = ref(false);
const deletingId = ref(null);
const restoringId = ref(null);
const forceDeletingId = ref(null);
const error = ref(null);
const successMessage = ref(null);
const showModal = ref(false); // Add/Edit modal
const isEditing = ref(false);
const modalError = ref(null); // Add/Edit modal error
const currentMaterial = reactive({ uuid: null, name: '', is_active: true, description: '', supplier_name: '', supplier_contact: '' });

// Audit Log State
const showAuditModal = ref(false);
const isAuditLoading = ref(false);
const auditError = ref(null);
const auditLogs = ref([]);
const auditedMaterialName = ref('');

// Confirmation Modal State
const confirmationState = reactive({
    show: false,
    message: '',
    itemName: '',
    type: 'delete', // 'delete' or 'forceDelete'
    onConfirm: () => {},
});

// --- Watchers ---
watch(() => [filters.search, filters.status, filters.per_page], () => {
    if (viewMode.value === 'active') {
        if (pagination.value.currentPage !== 1) pagination.value.currentPage = 1;
    } else { // Trash view only uses search and per_page
        if (trashedPagination.value.currentPage !== 1) trashedPagination.value.currentPage = 1;
    }
}, { deep: true });


// --- Computed Properties ---
const currentPagination = computed(() => viewMode.value === 'active' ? pagination.value : trashedPagination.value);
const currentTotalPages = computed(() => currentPagination.value.totalPages);
const currentTotalItems = computed(() => currentPagination.value.totalItems);
const trashedCountForDisplay = computed(() => trashedCount.value > 99 ? '99+' : trashedCount.value);

// List empty states
const isActiveListEmpty = computed(() => materials.value.length === 0);
const isTrashedListEmpty = computed(() => trashedMaterials.value.length === 0);

// Filter state
const hasActiveFilters = computed(() => filters.search || (viewMode.value === 'active' && filters.status !== ''));

// Action button states
const actionInProgress = (uuid) => deletingId.value === uuid || restoringId.value === uuid || forceDeletingId.value === uuid;
const isSaveDisabled = computed(() => isSaving.value || !currentMaterial.name || !currentMaterial.name.trim());

// Sort icons & aria attributes
const getSortIcon = (column) => {
    if (viewMode.value !== 'active' || filters.sort_by !== column) return 'fas fa-sort text-muted opacity-50';
    return filters.sort_direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
};
const getAriaSort = (column) => {
    if (viewMode.value !== 'active' || filters.sort_by !== column) return 'none';
    return filters.sort_direction === 'asc' ? 'ascending' : 'descending';
};

// Simple pagination range generator (unchanged)
const simplePaginationRange = computed(() => {
    const current = currentPagination.value.currentPage; const last = currentTotalPages.value;
    if (!last || last <= 1) return last === 1 ? [1] : [];
    const delta = 1; const range = []; const rangeWithDots = []; let l;
    range.push(1);
    for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) { range.push(i); }
    if (last > 1) range.push(last);
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);
    uniqueRange.forEach((i) => { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l > 2) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; });
    return rangeWithDots;
});

// --- API Functions ---
async function fetchMaterials() {
    isLoading.value = true; clearError();
    filters.page = pagination.value.currentPage;
    filters.per_page = parseInt(filters.per_page, 10) || 15;
    const params = {
        page: filters.page, per_page: filters.per_page,
        sort_by: filters.sort_by, sort_direction: filters.sort_direction,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== '' && { status: filters.status }), // Use 'status' directly
    };
    try {
        const response = await apiClient.get('/materials', { params });
        if (response.data?.data && response.data?.meta) {
            materials.value = response.data.data;
            pagination.value = {
                currentPage: response.data.meta.current_page ?? 1, totalPages: response.data.meta.last_page ?? 1,
                totalItems: response.data.meta.total ?? 0, perPage: parseInt(response.data.meta.per_page ?? filters.per_page, 10),
            };
            // Trash count fetched separately
        } else {
            console.warn("Unexpected data structure for materials:", response.data);
            materials.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page };
        }
    } catch (err) {
        error.value = getErrorMessage(err, 'Gagal memuat data material.');
        materials.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page };
    } finally { isLoading.value = false; }
}

async function fetchTrashedMaterials() {
    isLoading.value = true; clearError();
    const trashPage = trashedPagination.value.currentPage;
    const trashPerPage = parseInt(filters.per_page, 10) || 15;
    const params = { page: trashPage, per_page: trashPerPage, ...(filters.search && { search: filters.search }), };
    try {
        const response = await apiClient.get('/materials/trash', { params });
         if (response.data?.data && response.data?.meta) {
            trashedMaterials.value = response.data.data;
            trashedPagination.value = {
                currentPage: response.data.meta.current_page ?? 1, totalPages: response.data.meta.last_page ?? 1,
                totalItems: response.data.meta.total ?? 0, perPage: parseInt(response.data.meta.per_page ?? trashPerPage, 10),
            };
            trashedCount.value = response.data.meta.total ?? 0; // Update count from trash response
        } else {
            console.warn("Unexpected data structure for trashed materials:", response.data);
            trashedMaterials.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage };
            trashedCount.value = 0;
        }
    } catch (err) {
        error.value = getErrorMessage(err, 'Gagal memuat data material dari tempat sampah.');
        trashedMaterials.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage };
        trashedCount.value = 0;
    } finally { isLoading.value = false; }
}

// Fetches only the count, used initially and possibly after non-trash actions
async function fetchTrashCount() {
    // No need to run if already in trash view, as fetchTrashedMaterials gets the count
    if (viewMode.value !== 'trashed') {
        try {
            const response = await apiClient.get('/materials/trash', { params: { per_page: 1, page: 1 } });
            trashedCount.value = response.data.meta?.total ?? 0;
        } catch (err) {
            console.error("Failed to fetch material trash count:", getErrorMessage(err));
            // Avoid resetting count if it had a value before
        }
    }
}

async function saveMaterial() {
    if (isSaveDisabled.value) { modalError.value = "Nama material wajib diisi."; return; }
    isSaving.value = true; modalError.value = null; clearError();
    try {
        // Prepare supplier_info JSON string only if name or contact is provided
        let supplierInfoPayload = null;
        const name = currentMaterial.supplier_name?.trim();
        const contact = currentMaterial.supplier_contact?.trim();
        if (name || contact) {
            supplierInfoPayload = JSON.stringify({ name: name || '', contact: contact || '' });
        }

        const payload = {
            name: currentMaterial.name.trim(),
            is_active: !!currentMaterial.is_active, // Ensure boolean
            description: currentMaterial.description?.trim() || null, // Null if empty
            supplier_info: supplierInfoPayload, // Will be null if both name/contact are empty
        };

        const url = isEditing.value ? `/materials/${currentMaterial.uuid}` : '/materials';
        const method = isEditing.value ? 'put' : 'post';
        const response = await apiClient({ method, url, data: payload });

        if ((method === 'put' && response.status === 200) || (method === 'post' && response.status === 201)) {
            const savedName = response.data?.data?.name || currentMaterial.name;
            setSuccessMessage(`Material "${savedName}" berhasil ${isEditing.value ? 'diperbarui' : 'ditambahkan'}.`);
            closeAndResetModal();
            await fetchMaterials(); // Refresh active list
        } else {
             throw new Error(response.data?.message || `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} material. Status: ${response.status}`);
        }
    } catch (err) {
        modalError.value = getErrorMessage(err, `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} material.`);
    } finally {
        isSaving.value = false;
    }
}

async function deleteMaterial(uuid, name) {
    if (actionInProgress(uuid)) return;
    deletingId.value = uuid; clearError();
    try {
        const response = await apiClient.delete(`/materials/${uuid}`);
        if (response.status === 204 || response.status === 200) {
            setSuccessMessage(`Material "${name}" berhasil dipindahkan ke tempat sampah.`);
            const needsPageDecrement = materials.value.length === 1 && pagination.value.currentPage > 1;
            if (needsPageDecrement) pagination.value.currentPage--;
            await fetchMaterials(); // Refresh active list
            await fetchTrashCount(); // Update count badge
        } else {
            throw new Error(response.data?.message || `Gagal memindahkan material "${name}". Status: ${response.status}`);
        }
    } catch (err) {
        error.value = getErrorMessage(err, `Gagal memindahkan material "${name}" ke tempat sampah.`);
    } finally {
        deletingId.value = null;
    }
}

async function restoreMaterial(uuid, name) {
    if (actionInProgress(uuid)) return;
    restoringId.value = uuid; clearError();
    try {
        const response = await apiClient.post(`/materials/restore/${uuid}`);
        if (response.status === 200 && response.data?.message) {
            setSuccessMessage(response.data.message || `Material "${name}" berhasil dipulihkan.`);
            const needsPageDecrement = trashedMaterials.value.length === 1 && trashedPagination.value.currentPage > 1;
            if (needsPageDecrement) trashedPagination.value.currentPage--;
            await fetchTrashedMaterials(); // Refresh trash list & count
        } else {
            throw new Error(response.data?.message || `Gagal memulihkan material "${name}". Status: ${response.status}`);
        }
    } catch (err) {
        error.value = getErrorMessage(err, `Gagal memulihkan material "${name}".`);
    } finally {
        restoringId.value = null;
    }
}

async function forceDeleteMaterial(uuid, name) {
     if (actionInProgress(uuid)) return;
    forceDeletingId.value = uuid; clearError();
    try {
        const response = await apiClient.delete(`/materials/force-delete/${uuid}`);
        if (response.status === 204 || response.status === 200) {
            setSuccessMessage(`Material "${name}" berhasil dihapus permanen.`);
            const needsPageDecrement = trashedMaterials.value.length === 1 && trashedPagination.value.currentPage > 1;
            if (needsPageDecrement) trashedPagination.value.currentPage--;
            await fetchTrashedMaterials(); // Refresh trash list & count
        } else {
            throw new Error(response.data?.message || `Gagal menghapus material "${name}" permanen. Status: ${response.status}`);
        }
    } catch (err) {
        error.value = getErrorMessage(err, `Gagal menghapus material "${name}" secara permanen.`);
    } finally {
        forceDeletingId.value = null;
    }
}

// --- Confirmation Modal Logic ---
function askConfirmDeleteMaterial(uuid, name) {
    confirmationState.message = `Anda yakin ingin memindahkan material ini ke tempat sampah?`;
    confirmationState.itemName = name;
    confirmationState.type = 'delete';
    confirmationState.onConfirm = () => deleteMaterial(uuid, name);
    confirmationState.show = true;
    clearError(); // Clear main error when showing confirmation
}

function askConfirmForceDeleteMaterial(uuid, name) {
    confirmationState.message = `Anda yakin ingin menghapus material ini secara <strong>permanen</strong>?`;
    confirmationState.itemName = name;
    confirmationState.type = 'forceDelete';
    confirmationState.onConfirm = () => forceDeleteMaterial(uuid, name);
    confirmationState.show = true;
    clearError(); // Clear main error when showing confirmation
}

function cancelConfirmation() {
    confirmationState.show = false;
    confirmationState.onConfirm = () => {}; // Clear callback
}

function confirmAction() {
    if (typeof confirmationState.onConfirm === 'function') {
        confirmationState.onConfirm();
    }
    cancelConfirmation(); // Close modal after initiating action
}

// --- UI Functions ---
function applyFilters() {
    clearError();
    // Watcher handles page reset, just fetch
    if (viewMode.value === 'active') fetchMaterials();
    else fetchTrashedMaterials();
}
function clearSearch() {
    if (filters.search) { filters.search = ''; applyFilters(); }
}
function clearAllFilters() {
    filters.search = ''; filters.status = ''; applyFilters();
}
function clearError() { error.value = null; modalError.value = null; auditError.value = null; }
function setSuccessMessage(message) {
    successMessage.value = message;
    // Use setTimeout to clear the message after a delay
    setTimeout(() => {
        // Check if the current message is still the one we set
        if (successMessage.value === message) {
            successMessage.value = null;
        }
    }, 5000); // 5 seconds
}
function changePage(page) {
    if (isLoading.value || page === '...' || page < 1) return;
    clearError();
    if (viewMode.value === 'active') {
        if (page <= pagination.value.totalPages && page !== pagination.value.currentPage) {
            pagination.value.currentPage = page; fetchMaterials();
        }
    } else {
        if (page <= trashedPagination.value.totalPages && page !== trashedPagination.value.currentPage) {
            trashedPagination.value.currentPage = page; fetchTrashedMaterials();
        }
    }
}
function changeSort(column) {
    if (viewMode.value !== 'active' || isLoading.value) return;
    clearError();
    if (filters.sort_by === column) {
        filters.sort_direction = filters.sort_direction === 'asc' ? 'desc' : 'asc';
    } else {
        filters.sort_by = column; filters.sort_direction = 'asc';
    }
    applyFilters(); // Fetches data with new sort
}
function openAddModal() {
    isEditing.value = false; modalError.value = null; clearError();
    Object.assign(currentMaterial, { uuid: null, name: '', is_active: true, description: '', supplier_name: '', supplier_contact: '' });
    showModal.value = true;
}
function openEditModal(material) {
    isEditing.value = true; modalError.value = null; clearError();
    const parsedInfo = parsedSupplierInfo(material.supplier_info);
    Object.assign(currentMaterial, {
        uuid: material.uuid, name: material.name, is_active: !!material.is_active, // Ensure boolean
        description: material.description || '', supplier_name: parsedInfo.name, supplier_contact: parsedInfo.contact
    });
    showModal.value = true;
}
function closeAndResetModal() {
    showModal.value = false; isEditing.value = false; modalError.value = null;
    Object.assign(currentMaterial, { uuid: null, name: '', is_active: true, description: '', supplier_name: '', supplier_contact: '' });
}
function switchViewMode(mode) {
    if (mode === viewMode.value || isLoading.value) return;
    viewMode.value = mode;
    clearError(); successMessage.value = null; // Clear feedback
    // Apply filters will reset pagination and fetch correct data
    applyFilters();
}

// --- Audit Log Functions ---
async function fetchAuditLogs(uuid) {
    isAuditLoading.value = true; auditError.value = null; auditLogs.value = [];
    try {
        const response = await apiClient.get(`/materials/${uuid}/audits`);
        // Expecting response.data.data from the ResourceCollection
        if (response.data?.data && Array.isArray(response.data.data)) {
            auditLogs.value = response.data.data;
        } else {
            console.warn("Received unexpected data structure for audit logs:", response.data);
            auditLogs.value = [];
             // Optionally set an error if data structure is wrong but request succeeded
             if (response.status === 200) {
                 auditError.value = 'Format data riwayat tidak sesuai.';
             }
        }
    } catch (err) {
        console.error("Error fetching audit logs:", err);
        auditError.value = getErrorMessage(err, 'Gagal memuat riwayat perubahan.');
    } finally {
        isAuditLoading.value = false;
    }
}
function openAuditModal(material) {
    if (isAuditLoading.value) return;
    auditedMaterialName.value = material.name || 'Material';
    clearError(); // Clear main page errors
    auditError.value = null; // Clear previous audit errors
    auditLogs.value = []; // Clear previous logs
    showAuditModal.value = true;
    fetchAuditLogs(material.uuid);
}
function closeAuditModal() {
    showAuditModal.value = false; auditLogs.value = []; auditError.value = null; auditedMaterialName.value = ''; isAuditLoading.value = false;
}

// --- Helper/Formatting Functions ---
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return dateString; // Return original if invalid
        return date.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; // Fallback
    }
};
const parsedSupplierInfo = (info) => {
    let name = '', contact = '';
    if (!info) return { name, contact }; // Return empty if null/undefined

    try {
        // Attempt to parse if it's a string
        const parsed = (typeof info === 'string') ? JSON.parse(info) : info;

        // Check if parsed result is a valid object
        if (typeof parsed === 'object' && parsed !== null) {
            name = parsed.name || '';
            contact = parsed.contact || '';
        } else {
            // Handle cases where info is a string but not valid JSON, or other types
            console.warn("Could not parse supplier_info, expected object or JSON string:", info);
        }
    } catch (e) {
        // Handle JSON parsing errors specifically
        console.error("Failed to parse supplier_info JSON:", info, e);
        // Optionally, try to display the raw string if parsing fails and it's a string
        if (typeof info === 'string') name = info;
    }
    return { name, contact };
};
const formatAuditTimestamp = (dateString) => formatDate(dateString);
const formatFieldName = (fieldName) => {
    const map = {
        'name': 'Nama Material',
        'is_active': 'Status',
        'description': 'Deskripsi',
        'supplier_info': 'Info Supplier'
    };
    return map[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};
const formatAuditEvent = (event) => {
    const map = { 'created': 'Dibuat', 'updated': 'Diperbarui', 'deleted': 'Dihapus (Trash)', 'restored': 'Dipulihkan', 'forceDeleted': 'Hapus Permanen' };
    return map[event] || (event ? event.charAt(0).toUpperCase() + event.slice(1) : 'Unknown');
};
const auditEventBadgeClass = (event) => {
     const map = { 'created': 'bg-success-light text-success', 'updated': 'bg-warning-light text-warning', 'deleted': 'bg-danger-light text-danger', 'restored': 'bg-info-light text-info', 'forceDeleted': 'bg-danger fw-bold text-white' };
     return map[event] || 'bg-secondary-light text-secondary';
};
const formatAuditValue = (value) => {
    if (value === null || value === undefined) return '<i class="text-muted">null/kosong</i>';
    if (typeof value === 'boolean') return value ? 'Aktif' : 'Tidak Aktif';

    // Try to parse supplier_info specifically
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
             // Check if it looks like supplier info
            if (typeof parsed === 'object' && parsed !== null && (parsed.name !== undefined || parsed.contact !== undefined)) {
                const name = parsed.name || '-';
                const contact = parsed.contact || '-';
                return `<span class="badge bg-light text-dark border">Supplier: ${name}, Kontak: ${contact}</span>`;
            }
        } catch (e) { /* Ignore if not JSON or not supplier format */ }
    }

     // Fallback for other types or non-supplier JSON strings
    const strValue = String(value);
    // Simple escape for HTML display if needed, though Vue handles basic cases
    return strValue.replace(/</g, '<').replace(/>/g, '>');
};


// --- Lifecycle Hook ---
onMounted(async () => {
     isLoading.value = true; // Set loading for initial fetches
     try {
        // Fetch initial active materials and the trash count concurrently
        await Promise.all([
            fetchMaterials(),
            fetchTrashCount()
        ]);
     } catch (err) {
        console.error("Error during initial data fetch:", err);
        // Individual fetch functions handle setting the main error state
     } finally {
         isLoading.value = false;
     }
});

</script>

<style scoped>
/* Re-use or adapt styles from the previous components */
.dashboard-view { padding: 2rem 0; background-color: #f8f9fa; }
.material-manager-container { background-color: #ffffff; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075); }
.page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #dee2e6; }
.page-title { font-size: 1.75rem; font-weight: 500; margin: 0; }
.filter-section.card { border: none; }
.filter-item .input-group-text { border-right: 0; background-color: #e9ecef; }
.filter-item .form-control { border-left: 0; }
.filter-item .form-control:focus { box-shadow: none; border-color: #ced4da; }
.modern-table { border-collapse: separate; border-spacing: 0; width: 100%; }
.modern-table th, .modern-table td { padding: 0.85rem 1rem; vertical-align: middle; font-size: 0.9rem; }
.modern-table thead th { background-color: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057; white-space: nowrap; }
.modern-table tbody tr:hover { background-color: #f1f3f5; }
.modern-table td { color: #212529; }
.sortable-header { cursor: pointer; user-select: none; }
.sortable-header:hover { color: #0d6efd; }
.sortable-header i { font-size: 0.8em; margin-left: 0.3rem; }
.action-buttons { display: flex; justify-content: center; gap: 0.4rem; flex-wrap: nowrap; } /* Slightly reduced gap */
.btn-icon { padding: 0.3rem 0.6rem; font-size: 0.85rem; line-height: 1; }
.badge { padding: 0.4em 0.65em; font-size: 0.78rem; font-weight: 600; }
.bg-success-light { background-color: rgba(25, 135, 84, 0.1); }
.text-success { color: #198754 !important; }
.bg-secondary-light { background-color: rgba(108, 117, 125, 0.1); }
.text-secondary { color: #6c757d !important; }
.bg-warning-light { background-color: rgba(255, 193, 7, 0.1); }
.text-warning { color: #ffc107 !important; }
.bg-info-light { background-color: rgba(13, 202, 240, 0.1); }
.text-info { color: #0dcaf0 !important; }
.bg-danger-light { background-color: rgba(220, 53, 69, 0.1); }
.text-danger { color: #dc3545 !important; }


/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1050; }
.modal-dialog { width: 90%; margin: 1.75rem auto;}
.modal-dialog:not(.modal-xl) { max-width: 600px; /* Slightly wider default modal */ }
.modal-content { border: none; border-radius: 0.5rem; }
.modal-header { padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; }
/* Custom modal header colors */
.modal-header.bg-danger { border-bottom-color: rgba(0,0,0,0.2); }
.modal-header.bg-warning { border-bottom-color: rgba(0,0,0,0.1); color: #000 !important; } /* Warning needs text adjustment */
.modal-body { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; background-color: #f8f9fa; }
.modern-form .form-label { font-weight: 500; margin-bottom: 0.3rem; font-size: 0.9rem; }
.modern-form fieldset legend { font-size: 0.9rem !important; font-weight: 500; color: #495057; }
.btn .spinner-border { vertical-align: middle; }

/* Audit Log Specific Styles */
.audit-log-list table { font-size: 0.85rem; /* Smaller font for logs */ }
.audit-log-list .changes-cell ul { margin-left: 1rem; }
.audit-log-list .change-value { display: inline-block; }
.modal-dialog.modal-xl { max-width: 1140px; } /* Ensure XL modal width */

/* Responsive adjustments */
@media (max-width: 767.98px) {
    .page-header { flex-direction: column; align-items: flex-start; }
    .pagination-controls { flex-direction: column; align-items: center; }
    .filter-section .card-body { align-items: stretch !important; }
    .filter-item { min-width: 0 !important; width: 100%; }
    .filter-item.ms-md-auto { margin-left: 0 !important; margin-top: 0.5rem; display: flex; justify-content: flex-end; }
    .modern-table th, .modern-table td { font-size: 0.85rem; padding: 0.75rem; } /* Smaller padding/font on mobile */
    .action-buttons { gap: 0.3rem; }
}

.supplier-info span {
  max-width: 100%; /* Ensure supplier info doesn't overflow cell */
}

</style>