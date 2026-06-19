function addNewRow() {
    const container = document.getElementById("lineItemsContainer");
    const newRow = document.createElement("div");
    newRow.className = "line-item";
    newRow.style = "display: flex; gap: 10px; align-items: center;";
    newRow.innerHTML = `
        <input type="text" class="item-name" placeholder="Name">
        <input type="text" list="starList" class="item-star" placeholder="Star">
        <input type="number" class="item-quantity" placeholder="Qty" value="1" style="flex: 0 1 80px;">
        <input type="number" class="item-amount" placeholder="Amount" style="flex: 0 1 100px;">
        <button type="button" class="remove-btn" onclick="removeRow(this)" style="background-color: #dc3545; padding: 10px; flex: 0 0 auto;">X</button>
    `;
    container.appendChild(newRow);
}

function removeRow(btn) {
    const row = btn.parentElement;
    const container = document.getElementById("lineItemsContainer");
    if (container.children.length > 1) {
        container.removeChild(row);
    } else {
        alert("You must have at least one row.");
    }
}

function generateReceipt(){
    let currentSno = localStorage.getItem("receiptSno") || 1;
    currentSno = parseInt(currentSno);
    localStorage.setItem("receiptSno", currentSno + 1);

    const receiptNo = "REC-" + Date.now();
    const d = new Date();
    const today = String(d.getDate()).padStart(2, '0') + "-" + 
                  String(d.getMonth() + 1).padStart(2, '0') + "-" + 
                  d.getFullYear();

    document.getElementById("receiptNoText").innerText = receiptNo;
    document.getElementById("bookingDateText").innerText = today;
    document.getElementById("dateText").innerText = today;

    // Global fields
    const deityVal = document.getElementById("deity").value;
    document.getElementById("deityText").innerText = deityVal;
    document.getElementById("deityContainer").style.display = deityVal ? "" : "none";

    const poojaValGlobal = document.getElementById("pooja").value;
    document.getElementById("poojaHeadingText").innerText = poojaValGlobal;
    document.getElementById("poojaHeadingContainer").style.display = poojaValGlobal ? "" : "none";

    let offeringDate = document.getElementById("offeringDate").value;
    if (offeringDate) {
        const parts = offeringDate.split('-');
        offeringDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    document.getElementById("offeringDateText").innerText = offeringDate;
    document.getElementById("offeringDateContainer").style.display = offeringDate ? "" : "none";

    // Track column visibility and grand total
    let hasName = false, hasStar = false, hasQty = false, hasAmount = false;
    let grandTotal = 0;
    
    const tbody = document.getElementById("receiptTableBody");
    tbody.innerHTML = ""; // clear previous rows
    
    const lineItems = document.querySelectorAll(".line-item");
    let rowNum = 1;
    
    lineItems.forEach((item) => {
        const nameVal = item.querySelector(".item-name").value;
        const starVal = item.querySelector(".item-star").value;
        const qtyVal = item.querySelector(".item-quantity").value;
        const amtVal = item.querySelector(".item-amount").value;
        
        if(nameVal) hasName = true;
        if(starVal) hasStar = true;
        if(qtyVal) hasQty = true;
        if(amtVal) hasAmount = true;
        
        const qty = parseInt(qtyVal) || 1;
        const amt = parseFloat(amtVal) || 0;
        if(amtVal) grandTotal += (qty * amt);

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
        
        tbody.appendChild(tr);
        rowNum++;
    });

    // Hide/Show columns globally
    document.getElementById("th-name").style.display = hasName ? "" : "none";
    document.getElementById("th-star").style.display = hasStar ? "" : "none";
    document.getElementById("th-quantity").style.display = hasQty ? "" : "none";
    document.getElementById("th-amount").style.display = hasAmount ? "" : "none";

    const allTrs = tbody.querySelectorAll("tr");
    allTrs.forEach(tr => {
        tr.querySelector(".col-name").style.display = hasName ? "" : "none";
        tr.querySelector(".col-star").style.display = hasStar ? "" : "none";
        tr.querySelector(".col-quantity").style.display = hasQty ? "" : "none";
        tr.querySelector(".col-amount").style.display = hasAmount ? "" : "none";
    });

    // Grand total
    document.getElementById("totalAmountText").innerText = grandTotal ? grandTotal + "/-" : " ";
    const grandTotalBox = document.getElementById("grandTotalBox");
    grandTotalBox.style.display = hasAmount ? "" : "none";

    // Show the receipt details after generating
    document.getElementById("receiptHeaderLeft").style.visibility = "visible";
    document.getElementById("receiptHeaderRight").style.visibility = "visible";
    document.getElementById("poojaHeadingContainer").style.visibility = "visible";
    document.getElementById("receiptTableContainer").style.visibility = "visible";
    grandTotalBox.style.visibility = "visible";
}

function updateScale() {
    const receipt = document.getElementById("receipt");
    if (!receipt) return;

    // Available width for receipt (viewport minus padding), max 800px
    const availableWidth = Math.min(window.innerWidth - 20, 800);
    const scale = availableWidth / 800;

    receipt.style.transform = `scale(${scale})`;

    // Remove the trailing blank space since CSS transform doesn't affect document flow
    const actualHeight = receipt.offsetHeight;
    if (actualHeight > 0) {
        const scaledHeight = actualHeight * scale;
        receipt.style.marginBottom = `-${actualHeight - scaledHeight}px`;
    }
}

// Ensure it scales correctly on load and resize
window.addEventListener("resize", updateScale);
window.addEventListener("load", updateScale);
const imgTemplate = document.getElementById("template");
if (imgTemplate) {
    imgTemplate.addEventListener("load", updateScale);
}
updateScale();

function downloadPDF(){
    const receipt = document.getElementById("receipt");
    if (!receipt) return;

    // Temporarily remove scaling so the PDF captures the full resolution
    const originalTransform = receipt.style.transform;
    receipt.style.transform = 'scale(1)';

    const opt = {
        margin:       0,
        filename:     'Receipt.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, allowTaint: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(receipt).save().then(() => {
        // Restore the scaling after PDF generation
        receipt.style.transform = originalTransform;
    }).catch(err => {
        console.error("PDF generation error: ", err);
        alert("Failed to generate PDF. If you are opening this file locally (file://), your browser is blocking it due to security rules. Please use a local server (like VS Code Live Server) or deploy it.");
        receipt.style.transform = originalTransform;
    });
}

const stars = [
    "അശ്വതി",
    "രോഹിണി",
    "ഭരണി",
    "കാർത്തിക",
    "മകീര്യം",
    "തിരുവാതിര",
    "പുണർതം",
    "പൂയം",
    "ആയില്യം",
    "മകം",
    "പൂരം",
    "ഉത്രം",
    "അത്തം",
    "ചിത്തിര",
    "ചോതി",
    "വിശാഖം",
    "അനിഴം",
    "തൃക്കേട്ട",
    "മൂലം",
    "പൂരാടം",
    "ഉത്രാടം",
    "തിരുവോണം",
    "അവിട്ടം",
    "ചതയം",
    "പൂരുരുട്ടാതി",
    "ഉത്രട്ടാതി",
    "രേവതി"
];

function toggleBackground() {
    const templateImg = document.getElementById("template");
    if (!templateImg) return;
    
    // Check if the current src includes "blank paper.png" (URL-encoded paths might have %20)
    if (templateImg.src.includes("blank%20paper.png") || templateImg.src.includes("blank paper.png")) {
        templateImg.src = "canvareceipt-1.png";
    } else {
        templateImg.src = "blank paper.png";
    }
}