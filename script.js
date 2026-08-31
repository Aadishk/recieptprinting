function addNewRow() {
    const container = document.getElementById("lineItemsContainer");
    if (!container) return;
    const newRow = document.createElement("div");
    newRow.className = "line-item";
    newRow.innerHTML = `
        <div class="item-cell col-flex-1">
            <input type="text" class="item-name" placeholder="Name" autocomplete="off">
        </div>
        <div class="item-cell col-flex-1">
            <input type="text" list="starList" class="item-star" placeholder="Star" autocomplete="off">
        </div>
        <div class="item-cell col-qty">
            <input type="number" class="item-quantity" placeholder="Qty" value="1" min="1">
        </div>
        <div class="item-cell col-amt">
            <input type="number" class="item-amount" placeholder="Amount" min="0">
        </div>
        <div class="item-cell col-action">
            <button type="button" class="remove-btn" onclick="removeRow(this)" title="Remove item">✕</button>
        </div>
    `;
    container.appendChild(newRow);
    autoFillPoojaPrice();
    if (window.ManglishEngine && typeof window.ManglishEngine.bindAll === 'function') {
        window.ManglishEngine.bindAll();
    }
}

function removeRow(btn) {
    const row = btn ? btn.closest('.line-item') : null;
    const container = document.getElementById("lineItemsContainer");
    if (row && container && container.children.length > 1) {
        container.removeChild(row);
    } else {
        alert("You must have at least one row.");
    }
}

function removeLastRow() {
    const container = document.getElementById("lineItemsContainer");
    if (container && container.children.length > 1) {
        container.removeChild(container.lastElementChild);
    } else {
        alert("You must have at least one row.");
    }
}

function generateReceipt() {
    const d = new Date();
    const today = String(d.getDate()).padStart(2, '0') + "-" +
        String(d.getMonth() + 1).padStart(2, '0') + "-" +
        d.getFullYear();

    const bookingEl = document.getElementById("bookingDateText");
    const dateTextEl = document.getElementById("dateText");
    if (bookingEl) bookingEl.innerText = today;
    if (dateTextEl) dateTextEl.innerText = today;

    // Global fields
    const deityInput = document.getElementById("deity");
    const deityVal = deityInput ? deityInput.value : "";
    const deityTextEl = document.getElementById("deityText");
    const deityContainer = document.getElementById("deityContainer");
    if (deityTextEl) deityTextEl.innerText = deityVal;
    if (deityContainer) deityContainer.style.display = deityVal ? "" : "none";

    const poojaInput = document.getElementById("pooja");
    const poojaValGlobal = poojaInput ? poojaInput.value : "";
    const poojaHeadEl = document.getElementById("poojaHeadingText");
    const poojaHeadContainer = document.getElementById("poojaHeadingContainer");
    if (poojaHeadEl) poojaHeadEl.innerText = poojaValGlobal;
    if (poojaHeadContainer) poojaHeadContainer.style.display = poojaValGlobal ? "" : "none";

    const offeringInput = document.getElementById("offeringDate");
    let offeringDate = offeringInput ? offeringInput.value : "";
    if (offeringDate && offeringDate.includes('-')) {
        const parts = offeringDate.split('-');
        offeringDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const offeringTextEl = document.getElementById("offeringDateText");
    const offeringContainer = document.getElementById("offeringDateContainer");
    if (offeringTextEl) offeringTextEl.innerText = offeringDate;
    if (offeringContainer) offeringContainer.style.display = offeringDate ? "" : "none";

    // Track column visibility and grand total
    let hasName = false, hasStar = false, hasQty = false, hasAmount = false;
    let grandTotal = 0;

    const tbody = document.getElementById("receiptTableBody");
    if (tbody) tbody.innerHTML = ""; // clear previous rows

    const lineItems = document.querySelectorAll(".line-item");
    let rowNum = 1;
    const lineItemsPayload = [];

    lineItems.forEach((item) => {
        const nameEl = item.querySelector(".item-name");
        const starEl = item.querySelector(".item-star");
        const qtyEl = item.querySelector(".item-quantity");
        const amtEl = item.querySelector(".item-amount");

        const nameVal = nameEl ? nameEl.value : "";
        const starVal = starEl ? starEl.value : "";
        const qtyVal = qtyEl ? qtyEl.value : "1";
        const amtVal = amtEl ? amtEl.value : "";

        if (nameVal) hasName = true;
        if (starVal) hasStar = true;
        if (qtyVal) hasQty = true;
        if (amtVal) hasAmount = true;

        const qty = parseInt(qtyVal) || 1;
        const amt = parseFloat(amtVal) || 0;
        if (amtVal) grandTotal += (qty * amt);

        lineItemsPayload.push({
            name: nameVal,
            star: starVal,
            qty: qtyVal,
            amount: amtVal
        });

        const tr = document.createElement("tr");

        const tdSno = document.createElement("td");
        tdSno.innerText = String(rowNum).padStart(2, '0');
        tr.appendChild(tdSno);

        const tdName = document.createElement("td");
        tdName.className = "col-name";
        tdName.innerText = nameVal;
        tr.appendChild(tdName);

        const tdStar = document.createElement("td");
        tdStar.className = "col-star";
        tdStar.innerText = starVal;
        tr.appendChild(tdStar);

        const tdQty = document.createElement("td");
        tdQty.className = "col-quantity";
        tdQty.innerText = qtyVal ? String(qtyVal).padStart(2, '0') : "";
        tr.appendChild(tdQty);

        const tdAmt = document.createElement("td");
        tdAmt.className = "col-amount";
        tdAmt.innerText = amtVal ? amtVal + ".00" : "";
        tr.appendChild(tdAmt);

        if (tbody) tbody.appendChild(tr);
        rowNum++;
    });

    // Hide/Show columns globally
    const thName = document.getElementById("th-name");
    const thStar = document.getElementById("th-star");
    const thQty = document.getElementById("th-quantity");
    const thAmt = document.getElementById("th-amount");
    if (thName) thName.style.display = hasName ? "" : "none";
    if (thStar) thStar.style.display = hasStar ? "" : "none";
    if (thQty) thQty.style.display = hasQty ? "" : "none";
    if (thAmt) thAmt.style.display = hasAmount ? "" : "none";

    if (tbody) {
        const allTrs = tbody.querySelectorAll("tr");
        allTrs.forEach(tr => {
            const colN = tr.querySelector(".col-name");
            const colS = tr.querySelector(".col-star");
            const colQ = tr.querySelector(".col-quantity");
            const colA = tr.querySelector(".col-amount");
            if (colN) colN.style.display = hasName ? "" : "none";
            if (colS) colS.style.display = hasStar ? "" : "none";
            if (colQ) colQ.style.display = hasQty ? "" : "none";
            if (colA) colA.style.display = hasAmount ? "" : "none";
        });
    }

    // Grand total
    const totalTextEl = document.getElementById("totalAmountText");
    if (totalTextEl) totalTextEl.innerText = grandTotal ? grandTotal + "/-" : " ";
    
    const grandTotalBox = document.getElementById("grandTotalBox");
    if (grandTotalBox) {
        grandTotalBox.style.display = hasAmount ? "" : "none";
        grandTotalBox.style.visibility = "visible";
    }

    // Show receipt elements
    const headLeft = document.getElementById("receiptHeaderLeft");
    const headRight = document.getElementById("receiptHeaderRight");
    const poojaHead = document.getElementById("poojaHeadingContainer");
    const tableContainer = document.getElementById("receiptTableContainer");

    if (headLeft) headLeft.style.visibility = "visible";
    if (headRight) headRight.style.visibility = "visible";
    if (poojaHead) poojaHead.style.visibility = "visible";
    if (tableContainer) tableContainer.style.visibility = "visible";

    // Set fallback/preview receipt number
    if (!document.getElementById("receiptNoText").innerText || document.getElementById("receiptNoText").innerText.startsWith("REC-DRAFT")) {
        fallbackReceiptNo();
    }
}

async function saveReceipt() {
    // 1. Ensure receipt is rendered on screen
    generateReceipt();

    // 2. Prepare receipt payload
    const deityVal = document.getElementById("deity") ? document.getElementById("deity").value : "";
    const poojaVal = document.getElementById("pooja") ? document.getElementById("pooja").value : "";
    let offeringDate = document.getElementById("offeringDate") ? document.getElementById("offeringDate").value : "";
    if (offeringDate && offeringDate.includes('-')) {
        const parts = offeringDate.split('-');
        offeringDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const d = new Date();
    const today = String(d.getDate()).padStart(2, '0') + "-" +
        String(d.getMonth() + 1).padStart(2, '0') + "-" +
        d.getFullYear();

    let grandTotal = 0;
    const lineItemsPayload = [];
    const lineItems = document.querySelectorAll(".line-item");

    lineItems.forEach((item) => {
        const nameVal = item.querySelector(".item-name") ? item.querySelector(".item-name").value : "";
        const starVal = item.querySelector(".item-star") ? item.querySelector(".item-star").value : "";
        const qtyVal = item.querySelector(".item-quantity") ? item.querySelector(".item-quantity").value : "1";
        const amtVal = item.querySelector(".item-amount") ? item.querySelector(".item-amount").value : "";

        const qty = parseInt(qtyVal) || 1;
        const amt = parseFloat(amtVal) || 0;
        if (amtVal) grandTotal += (qty * amt);

        lineItemsPayload.push({
            name: nameVal,
            star: starVal,
            qty: qtyVal,
            amount: amtVal
        });
    });

    const payload = {
        deity: deityVal,
        pooja: poojaVal,
        offering_date: offeringDate,
        booking_date: today,
        grand_total: grandTotal,
        line_items: lineItemsPayload
    };

    try {
        const res = await fetch('/api/receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data && data.success && data.receipt) {
            const rNoEl = document.getElementById("receiptNoText");
            if (rNoEl) rNoEl.innerText = data.receipt.receipt_no;
            alert(`Receipt ${data.receipt.receipt_no} saved successfully to database!`);
        } else {
            fallbackReceiptNo();
            alert("Receipt generated (local preview mode).");
        }
    } catch (e) {
        console.warn("Backend API offline:", e);
        fallbackReceiptNo();
        alert("Saved locally in browser preview mode.");
    }
}

function fallbackReceiptNo() {
    let currentSno = localStorage.getItem("receiptSno") || 1;
    currentSno = parseInt(currentSno);
    localStorage.setItem("receiptSno", currentSno + 1);
    const year = new Date().getFullYear();
    const rNoEl = document.getElementById("receiptNoText");
    if (rNoEl) {
        rNoEl.innerText = `REC-${year}-${String(currentSno).padStart(4, '0')}`;
    }
}

function updateScale() {
    const receipt = document.getElementById("receipt");
    if (!receipt) return;

    const availableWidth = Math.min(window.innerWidth - 20, 800);
    const scale = availableWidth / 800;

    receipt.style.transform = `scale(${scale})`;

    const actualHeight = receipt.offsetHeight;
    if (actualHeight > 0) {
        const scaledHeight = actualHeight * scale;
        receipt.style.marginBottom = `-${actualHeight - scaledHeight}px`;
    }
}

window.addEventListener("resize", updateScale);
window.addEventListener("load", updateScale);
const imgTemplate = document.getElementById("template");
if (imgTemplate) {
    imgTemplate.addEventListener("load", updateScale);
}
updateScale();

function downloadJPEG() {
    const receipt = document.getElementById("receipt");
    if (!receipt) return;

    generateReceipt();

    const originalTransform = receipt.style.transform;
    receipt.style.transform = 'scale(1)';

    const h2c = window.html2canvas;
    if (!h2c) {
        receipt.style.transform = originalTransform;
        alert("JPEG generator library loading. Please try again.");
        return;
    }

    h2c(receipt, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
    }).then(canvas => {
        receipt.style.transform = originalTransform;
        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        const rNoText = document.getElementById("receiptNoText");
        const receiptNo = (rNoText && rNoText.innerText) ? rNoText.innerText : 'Receipt';
        const link = document.createElement("a");
        link.download = `${receiptNo}.jpg`;
        link.href = imgData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(err => {
        console.warn("JPEG export fallback:", err);
        receipt.style.transform = originalTransform;
        window.print();
    });
}

function printReceipt() {
    const receipt = document.getElementById("receipt");
    if (!receipt) return;

    generateReceipt();
    window.print();
}

function downloadPDF() {
    downloadJPEG();
}

function toggleBackground() {
    const templateImg = document.getElementById("template");
    if (!templateImg) return;

    if (templateImg.src.includes("blank%20paper.png") || templateImg.src.includes("blank paper.png")) {
        templateImg.src = "canvareceipt-1.png";
    } else {
        templateImg.src = "blank paper.png";
    }
}

// --- RECEIPT HISTORY & BACKEND MODAL HANDLERS ---
let allHistoryReceipts = [];

function openHistoryModal() {
    let modal = document.getElementById("historyModal");
    if (!modal) return;

    modal.style.display = "flex";
    
    fetch('/api/receipts')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.receipts) {
                allHistoryReceipts = data.receipts;
                renderHistoryUI();
            }
        })
        .catch(err => {
            console.error("Error fetching history:", err);
            renderHistoryUI();
        });
}

function closeHistoryModal() {
    let modal = document.getElementById("historyModal");
    if (modal) modal.style.display = "none";
}

function clearHistoryFilters() {
    const searchEl = document.getElementById("historySearchInput");
    const poojaEl = document.getElementById("historyPoojaFilter");
    const dateTypeEl = document.getElementById("historyDateType");
    const dateEl = document.getElementById("historyDateFilter");
    const sortEl = document.getElementById("historySortFilter");

    if (searchEl) searchEl.value = "";
    if (poojaEl) poojaEl.value = "";
    if (dateTypeEl) dateTypeEl.value = "both";
    if (dateEl) dateEl.value = "";
    if (sortEl) sortEl.value = "DESC";

    renderHistoryUI();
}

function applyHistoryFilters() {
    renderHistoryUI();
}

function parseDateParts(str) {
    if (!str) return null;
    str = str.split('T')[0].replace(/\//g, '-').trim();
    const parts = str.split('-');
    if (parts.length !== 3) return null;

    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);

    if (isNaN(p1) || isNaN(p2) || isNaN(p3)) return null;

    let year, month, day;
    if (p1 > 1000) {
        year = p1;
        month = p2;
        day = p3;
    } else if (p3 > 1000) {
        day = p1;
        month = p2;
        year = p3;
    } else {
        return null;
    }

    return { year, month, day };
}

function matchesDate(record, dateVal, dateType = 'both') {
    if (!dateVal) return true;
    const filterParts = parseDateParts(dateVal);
    if (!filterParts) return true;

    let datesToCheck = [];
    if (dateType === 'offering') {
        datesToCheck = [record.offering_date];
    } else if (dateType === 'booking') {
        datesToCheck = [record.booking_date, record.created_at];
    } else {
        datesToCheck = [record.offering_date, record.booking_date, record.created_at];
    }

    for (const dStr of datesToCheck) {
        if (!dStr) continue;
        const recParts = parseDateParts(dStr);
        if (recParts) {
            if (recParts.year === filterParts.year &&
                recParts.month === filterParts.month &&
                recParts.day === filterParts.day) {
                return true;
            }
        }
    }
    return false;
}

function matchesPooja(record, poojaVal) {
    if (!poojaVal) return true;
    const pLower = poojaVal.toLowerCase().trim();

    if (record.pooja && (record.pooja.toLowerCase().includes(pLower) || pLower.includes(record.pooja.toLowerCase()))) return true;

    const lineItems = typeof record.line_items_json === 'string' ?
        JSON.parse(record.line_items_json || '[]') : (record.line_items_json || []);

    for (const item of lineItems) {
        if (item.name && item.name.toLowerCase().includes(pLower)) return true;
        if (item.star && item.star.toLowerCase().includes(pLower)) return true;
    }
    return false;
}

function matchesSearch(record, searchVal) {
    if (!searchVal) return true;
    const sLower = searchVal.toLowerCase().trim();

    if (record.receipt_no && record.receipt_no.toLowerCase().includes(sLower)) return true;
    if (record.deity && record.deity.toLowerCase().includes(sLower)) return true;
    if (record.pooja && record.pooja.toLowerCase().includes(sLower)) return true;
    if (record.booking_date && record.booking_date.toLowerCase().includes(sLower)) return true;
    if (record.offering_date && record.offering_date.toLowerCase().includes(sLower)) return true;

    const lineItems = typeof record.line_items_json === 'string' ?
        JSON.parse(record.line_items_json || '[]') : (record.line_items_json || []);

    for (const item of lineItems) {
        if (item.name && item.name.toLowerCase().includes(sLower)) return true;
        if (item.star && item.star.toLowerCase().includes(sLower)) return true;
    }
    return false;
}

function renderHistoryUI() {
    const tableBody = document.getElementById("historyTableBody");
    if (!tableBody) return;

    const searchVal = document.getElementById("historySearchInput") ? document.getElementById("historySearchInput").value : "";
    const poojaVal = document.getElementById("historyPoojaFilter") ? document.getElementById("historyPoojaFilter").value : "";
    const dateTypeVal = document.getElementById("historyDateType") ? document.getElementById("historyDateType").value : "both";
    const dateVal = document.getElementById("historyDateFilter") ? document.getElementById("historyDateFilter").value : "";
    const sortVal = document.getElementById("historySortFilter") ? document.getElementById("historySortFilter").value : "DESC";

    let filtered = allHistoryReceipts.filter(r => {
        return matchesSearch(r, searchVal) && matchesPooja(r, poojaVal) && matchesDate(r, dateVal, dateTypeVal);
    });

    if (sortVal === "ASC") {
        filtered.sort((a, b) => a.id - b.id);
    } else {
        filtered.sort((a, b) => b.id - a.id);
    }

    if (filtered.length > 0) {
        tableBody.innerHTML = "";
        let totalAmountSum = 0;
        let totalPeopleCount = 0;

        filtered.forEach(r => {
            const tr = document.createElement("tr");
            const lineItems = typeof r.line_items_json === 'string' ? JSON.parse(r.line_items_json || '[]') : (r.line_items_json || []);
            
            totalPeopleCount += lineItems.length || 1;
            totalAmountSum += parseFloat(r.grand_total) || 0;

            const offeringDateFormatted = r.offering_date ? `<span class="date-badge offering-badge">${r.offering_date}</span>` : '-';
            const createdDateFormatted = r.booking_date || (r.created_at ? r.created_at.split('T')[0] : '-');

            const devoteesFormatted = lineItems.map(i => {
                const n = i.name ? `<strong>${i.name}</strong>` : 'Anonymous';
                const s = i.star ? `<span class="devotee-star">(${i.star})</span>` : '';
                const q = i.qty && parseInt(i.qty) > 1 ? ` <span class="devotee-qty">x${i.qty}</span>` : '';
                return `<div class="devotee-item">${n} ${s}${q}</div>`;
            }).join('') || '-';

            tr.innerHTML = `
                <td>${offeringDateFormatted}</td>
                <td><span class="date-badge booking-badge">${createdDateFormatted}</span></td>
                <td><strong>${r.receipt_no}</strong></td>
                <td>${r.deity || '-'}</td>
                <td><span class="pooja-badge">${r.pooja || '-'}</span></td>
                <td>${devoteesFormatted}</td>
                <td><strong>₹${r.grand_total || 0}</strong></td>
                <td style="white-space: nowrap;">
                    <button type="button" class="btn-sm btn-reprint" onclick="loadReceiptFromBackend('${r.id}')" title="Load & Print">
                        Load & Print
                    </button>
                    <button type="button" class="btn-delete-record" onclick="deleteReceiptFromBackend('${r.id}')" title="Delete receipt record">
                        Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        const statPeople = document.getElementById("statTotalPeople");
        const statReceipts = document.getElementById("statTotalReceipts");
        const statAmount = document.getElementById("statTotalAmount");
        if (statPeople) statPeople.innerText = totalPeopleCount;
        if (statReceipts) statReceipts.innerText = filtered.length;
        if (statAmount) statAmount.innerText = `₹${totalAmountSum.toLocaleString('en-IN')}`;
    } else {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #64748b;">No receipts found matching selected criteria.</td></tr>`;
        const statPeople = document.getElementById("statTotalPeople");
        const statReceipts = document.getElementById("statTotalReceipts");
        const statAmount = document.getElementById("statTotalAmount");
        if (statPeople) statPeople.innerText = "0";
        if (statReceipts) statReceipts.innerText = "0";
        if (statAmount) statAmount.innerText = "₹0";
    }
}

function loadReceiptFromBackend(id) {
    fetch(`/api/receipts/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.receipt) {
                const r = data.receipt;
                const deityEl = document.getElementById("deity");
                const poojaEl = document.getElementById("pooja");
                if (deityEl) deityEl.value = r.deity || '';
                if (poojaEl) poojaEl.value = r.pooja || '';

                const lineItems = typeof r.line_items_json === 'string' ? JSON.parse(r.line_items_json || '[]') : (r.line_items_json || []);
                const container = document.getElementById("lineItemsContainer");
                if (container) container.innerHTML = "";

                if (lineItems.length > 0 && container) {
                    lineItems.forEach(item => {
                        const row = document.createElement("div");
                        row.className = "line-item";
                        row.innerHTML = `
                            <div class="item-cell col-flex-1">
                                <input type="text" class="item-name" value="${item.name || ''}" placeholder="Name" autocomplete="off">
                            </div>
                            <div class="item-cell col-flex-1">
                                <input type="text" list="starList" class="item-star" value="${item.star || ''}" placeholder="Star" autocomplete="off">
                            </div>
                            <div class="item-cell col-qty">
                                <input type="number" class="item-quantity" value="${item.qty || 1}" placeholder="Qty" min="1">
                            </div>
                            <div class="item-cell col-amt">
                                <input type="number" class="item-amount" value="${item.amount || ''}" placeholder="Amount" min="0">
                            </div>
                            <div class="item-cell col-action">
                                <button type="button" class="remove-btn" onclick="removeRow(this)" title="Remove item">✕</button>
                            </div>
                        `;
                        container.appendChild(row);
                    });
                } else {
                    addNewRow();
                }

                closeHistoryModal();
                generateReceipt();
            }
        })
        .catch(e => {
            alert("Failed to load receipt from server.");
        });
}

function deleteReceiptFromBackend(id) {
    if (!confirm("Are you sure you want to delete this receipt record from history?")) return;

    fetch(`/api/receipts/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                allHistoryReceipts = allHistoryReceipts.filter(r => r.id != id && r.receipt_no !== id);
                renderHistoryUI();
            } else {
                alert("Failed to delete receipt.");
            }
        })
        .catch(err => {
            console.error("Error deleting receipt:", err);
            alert("Error deleting receipt.");
        });
}

function clearAllHistoryRecords() {
    if (!confirm("CAUTION: Are you sure you want to ERASE ALL saved receipts from history? This cannot be undone.")) return;

    fetch('/api/receipts', { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                allHistoryReceipts = [];
                renderHistoryUI();
                alert("All history records erased successfully!");
            } else {
                alert("Failed to clear history.");
            }
        })
        .catch(err => {
            console.error("Error clearing history:", err);
            alert("Error clearing history.");
        });
}

function printHistoryReport() {
    const searchVal = document.getElementById("historySearchInput") ? document.getElementById("historySearchInput").value.trim() : "";
    const poojaVal = document.getElementById("historyPoojaFilter") ? document.getElementById("historyPoojaFilter").value.trim() : "";
    const dateTypeVal = document.getElementById("historyDateType") ? document.getElementById("historyDateType").value : "both";
    const dateVal = document.getElementById("historyDateFilter") ? document.getElementById("historyDateFilter").value.trim() : "";
    const sortVal = document.getElementById("historySortFilter") ? document.getElementById("historySortFilter").value : "DESC";

    let filtered = allHistoryReceipts.filter(r => {
        return matchesSearch(r, searchVal) && matchesPooja(r, poojaVal) && matchesDate(r, dateVal, dateTypeVal);
    });

    if (sortVal === "ASC") {
        filtered.sort((a, b) => a.id - b.id);
    } else {
        filtered.sort((a, b) => b.id - a.id);
    }

    if (filtered.length === 0) {
        alert("No records found matching current filters to print.");
        return;
    }

    // --- EXCEPTIONAL CASE: SHAKTHI POOJA DEDICATED PRINT LIST ---
    if (poojaVal.includes("ശക്തിപൂജ")) {
        const shakthiHeaderDate = document.getElementById("shakthiHeaderDate");
        const shakthiHeaderPoojaName = document.getElementById("shakthiHeaderPoojaName");
        const shakthiTableBody = document.getElementById("shakthiReportTableBody");

        let headerDateStr = "";
        if (dateVal) {
            const parts = dateVal.split('-');
            headerDateStr = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateVal;
        } else {
            const firstWithDate = filtered.find(r => r.offering_date || r.booking_date);
            headerDateStr = firstWithDate ? (firstWithDate.offering_date || firstWithDate.booking_date) : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        }

        if (shakthiHeaderDate) shakthiHeaderDate.innerText = headerDateStr;
        if (shakthiHeaderPoojaName) shakthiHeaderPoojaName.innerText = poojaVal || "ശക്തിപൂജ";

        if (shakthiTableBody) {
            shakthiTableBody.innerHTML = "";
            let sno = 1;

            filtered.forEach(r => {
                const lineItems = typeof r.line_items_json === 'string' ? JSON.parse(r.line_items_json || '[]') : (r.line_items_json || []);
                
                if (lineItems.length > 0) {
                    lineItems.forEach(item => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${sno++}</td>
                            <td><strong>${item.name || '-'}</strong></td>
                            <td>${item.star || '-'}</td>
                            <td>${r.receipt_no}</td>
                        `;
                        shakthiTableBody.appendChild(tr);
                    });
                } else {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${sno++}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>${r.receipt_no}</td>
                    `;
                    shakthiTableBody.appendChild(tr);
                }
            });
        }

        document.documentElement.classList.add("is-printing-shakthi-report");
        document.body.classList.add("is-printing-shakthi-report");
        window.print();

        setTimeout(() => {
            document.documentElement.classList.remove("is-printing-shakthi-report");
            document.body.classList.remove("is-printing-shakthi-report");
        }, 1000);
        return;
    }

    // --- STANDARD GENERIC POOJA REPORT FORM ---

    const reportTitleEl = document.getElementById("reportTitle");
    const repFilterCriteria = document.getElementById("repFilterCriteria");
    const repTotalPeople = document.getElementById("repTotalPeople");
    const repTotalAmount = document.getElementById("repTotalAmount");
    const repGeneratedDate = document.getElementById("repGeneratedDate");
    const repFooterDate = document.getElementById("repFooterDate");
    const repTableBody = document.getElementById("reportTableBody");

    const nowStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    if (repGeneratedDate) repGeneratedDate.innerText = nowStr;
    if (repFooterDate) repFooterDate.innerText = nowStr;

    if (reportTitleEl) {
        reportTitleEl.innerText = poojaVal ? `വഴിപാട് ലിസ്റ്റ് - ${poojaVal}` : "വഴിപാട് ലിസ്റ്റ് (POOJA REPORT)";
    }

    let filterSummaryArr = [];
    if (poojaVal) filterSummaryArr.push(`Pooja: ${poojaVal}`);
    if (dateVal) filterSummaryArr.push(`Date: ${dateVal}`);
    if (searchVal) filterSummaryArr.push(`Search: ${searchVal}`);
    if (repFilterCriteria) repFilterCriteria.innerText = filterSummaryArr.join(' | ') || 'All Records';

    let totalDevoteesCount = 0;
    let totalCollectionSum = 0;
    let sno = 1;

    if (repTableBody) {
        repTableBody.innerHTML = "";

        filtered.forEach(r => {
            const lineItems = typeof r.line_items_json === 'string' ? JSON.parse(r.line_items_json || '[]') : (r.line_items_json || []);
            const receiptPooja = r.pooja || poojaVal || '-';
            const offeringDate = r.offering_date || r.booking_date || '-';

            if (lineItems.length > 0) {
                lineItems.forEach(item => {
                    totalDevoteesCount++;
                    const itemAmt = parseFloat(item.amount) || 0;
                    totalCollectionSum += itemAmt;

                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${sno++}</td>
                        <td><strong>${item.name || '-'}</strong></td>
                        <td>${item.star || '-'}</td>
                        <td>${receiptPooja}</td>
                        <td>${offeringDate}</td>
                        <td>${item.qty || 1}</td>
                        <td>₹${item.amount || '0'}</td>
                        <td>${r.receipt_no}</td>
                    `;
                    repTableBody.appendChild(tr);
                });
            } else {
                totalDevoteesCount++;
                totalCollectionSum += (parseFloat(r.grand_total) || 0);

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${sno++}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>${receiptPooja}</td>
                    <td>${offeringDate}</td>
                    <td>1</td>
                    <td>₹${r.grand_total || '0'}</td>
                    <td>${r.receipt_no}</td>
                `;
                repTableBody.appendChild(tr);
            }
        });
    }

    if (repTotalPeople) repTotalPeople.innerText = totalDevoteesCount;
    if (repTotalAmount) repTotalAmount.innerText = `₹${totalCollectionSum.toLocaleString('en-IN')}`;

    document.documentElement.classList.add("is-printing-report");
    document.body.classList.add("is-printing-report");
    window.print();

    setTimeout(() => {
        document.documentElement.classList.remove("is-printing-report");
        document.body.classList.remove("is-printing-report");
    }, 1000);
}

// --- AUTO POOJA PRICE MAP & HANDLER ---
const POOJA_PRICES = {
    'കരിംകലശം': 7500,
    'രക്തപുഷ്പാഞ്ജലി': 50,
    'അർച്ചന': 20,
    'ശക്തിപൂജ (വലുത്)': 500,
    'ശക്തിപൂജ': 500,
    'നെയ്‌വിളക്ക്': 50,
    'കടുമ്പായസം': 300,
    'എള്ള്പായസം': 800,
    'നിവേദ്യം': 50,
    'ദേഹരക്ഷ': 150,
    'വാരാഹി യന്ത്രം': 300,
    'പഞ്ചാമൃതം': 80,
    'പുഷ്പാഞ്ജലി': 20,
    'ഗണപതി ഹോമം': 250
};

function autoFillPoojaPrice() {
    const poojaInput = document.getElementById("pooja");
    if (!poojaInput) return;
    const val = poojaInput.value ? poojaInput.value.trim() : "";
    if (!val) return;

    let price = undefined;

    // 1. Check <option data-price="..."> in #poojaList datalist FIRST
    const option = document.querySelector(`#poojaList option[value="${CSS.escape(val)}"]`) ||
                   document.querySelector(`#poojaList option[value="${val}"]`);

    if (option && option.dataset && option.dataset.price !== undefined && option.dataset.price !== "") {
        price = parseFloat(option.dataset.price);
    }

    // 2. Fallback to POOJA_PRICES map if datalist has no data-price attribute
    if (price === undefined || isNaN(price)) {
        price = POOJA_PRICES[val];
    }

    if (price !== undefined && !isNaN(price)) {
        const amountInputs = document.querySelectorAll(".item-amount");
        amountInputs.forEach((amtInput) => {
            if (!amtInput.value || amtInput.dataset.autoFilled === "true") {
                amtInput.value = price;
                amtInput.dataset.autoFilled = "true";
            }
        });
    }
}

// Attach event listeners for pooja auto fill & manual edit tracking
document.addEventListener("DOMContentLoaded", () => {
    const poojaInput = document.getElementById("pooja");
    if (poojaInput) {
        poojaInput.addEventListener("input", autoFillPoojaPrice);
        poojaInput.addEventListener("change", autoFillPoojaPrice);
    }

    document.addEventListener("input", (e) => {
        if (e.target && e.target.classList.contains("item-amount")) {
            e.target.dataset.autoFilled = "false";
        }
    });
});