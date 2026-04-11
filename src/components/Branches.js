/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Modal, ConfirmModal } from "./Toast";
import { api } from "../services/api";

export default function Branches() {
  const { state, dispatch, showToast, loadAll } = useApp();
  const { branches } = state;
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ branchName: "", city: "", address: "", phone: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!form.branchName || !form.city) { showToast("Заполните название и город", "error"); return; }
    const res = await api.createBranch(form);
    if (res) { showToast("Филиал добавлен!"); setModal(false); loadAll(); }
    else showToast("Ошибка при добавлении", "error");
    setForm({ branchName: "", city: "", address: "", phone: "" });
  };

  const handleDelete = async (id) => {
    await api.deleteBranch(id);
    showToast("Филиал удалён", "info");
    dispatch({ type: "SET_BRANCHES", payload: branches.filter(b => b.branchId !== id) });
    setConfirm(null);
  };

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Филиалы <span style={{ color: "var(--green)" }}>●</span></h1>
          <p className="section-sub">Сеть отделений банка · {branches.length} филиалов</p>
        </div>
        <button className="btn btn-green" onClick={() => setModal(true)}>+ Добавить филиал</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {branches.length === 0
          ? <div className="empty-state"><div className="ei">🏢</div><div className="et">Нет филиалов</div></div>
          : branches.map((b, i) => (
            <div key={b.branchId} className="card card-hover animate-in" style={{ animationDelay: ${i * 60}ms }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontSize: 28 }}>🏢</div>
                <span className="badge badge-green">Активен</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{b.branchName}</div>
              <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 12 }}>📍 {b.city}{b.address ? ", " + b.address : ""}</div>
              {b.phone && <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 12 }}>📞 {b.phone}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>ID: {b.branchId}</span>
                <button className="btn btn-sm btn-danger" onClick={() => setConfirm(b)}>Удалить</button>
              </div>
            </div>
          ))
        }
      </div>

      {modal && (
        <Modal title="Новый филиал" onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Отмена</button><button className="btn btn-green" onClick={handleAdd}>Добавить</button></>}>
          <div className="form-grid-2">
            {[["Название *", "branchName"], ["Город *", "city"], ["Адрес", "address"], ["Телефон", "phone"]].map(([l, k]) => (
              <div key={k} className="form-group">
                <label className="form-label">{l}</label>
                <input className="form-input" value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmModal message={Удалить филиал ""?}
          confirmText="Удалить" danger
          onConfirm={() => handleDelete(confirm.branchId)}
          onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}