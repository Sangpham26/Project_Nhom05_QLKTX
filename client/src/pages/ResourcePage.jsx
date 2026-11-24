import React, { useState } from "react";
import {
  Building2,
  BedDouble,
  ClipboardList,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import { api, date, money, labels } from "../services/api";
import { badge } from "../utils/formatters";
import { useNotice, useLoad } from "../hooks/useLoad";
import RoomTypeEditor from "../components/RoomTypeEditor";
import { coverOf } from "../components/RoomGallery";
import {
  PageTitle,
  SearchBar,
  Loading,
  Table,
  Pager,
  Empty,
  Section,
  Modal,
  Form,
  Toast,
} from "../components/common";

const resourceConfig = {
  buildings: {
    title: "Tòa nhà",
    singular: "tòa nhà",
    api: "buildings",
    icon: Building2,
    fields: [
      { label: "Mã tòa", name: "code", required: true },
      { label: "Tên tòa", name: "name", required: true },
      { label: "Mô tả", name: "description", rows: 2 },
      {
        label: "Trạng thái",
        name: "status",
        required: true,
        options: [
          { value: "ACTIVE", label: "Đang sử dụng" },
          { value: "INACTIVE", label: "Ngừng sử dụng" },
        ],
      },
    ],
    columns: [
      { key: "code", label: "Mã tòa" },
      { key: "name", label: "Tên tòa" },
      { key: "description", label: "Mô tả" },
      { key: "status", label: "Trạng thái", render: (x) => badge(x.status) },
    ],
  },
  "room-types": {
    title: "Loại phòng",
    singular: "loại phòng",
    api: "roomTypes",
    icon: BedDouble,
    fields: [
      { label: "Mã loại", name: "code", required: true },
      { label: "Tên loại phòng", name: "name", required: true },
      { label: "Mô tả", name: "description", rows: 2 },
      {
        label: "Giới tính áp dụng",
        name: "gender",
        required: true,
        options: [
          { value: "MALE", label: "Nam" },
          { value: "FEMALE", label: "Nữ" },
          { value: "ANY", label: "Tất cả" },
        ],
      },
      {
        label: "Sức chứa mặc định",
        name: "defaultCapacity",
        type: "number",
        min: 1,
        required: true,
      },
      {
        label: "Phí tham khảo / tháng",
        name: "fee",
        type: "number",
        min: 0,
        required: true,
      },
      {
        label: "Trạng thái",
        name: "status",
        required: true,
        options: [
          { value: "ACTIVE", label: "Đang sử dụng" },
          { value: "INACTIVE", label: "Ngừng sử dụng" },
        ],
      },
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên loại phòng" },
      {
        key: "images",
        label: "Ảnh",
        render: (x) =>
          coverOf(x) ? (
            <img className="resource-photo" src={coverOf(x).url} alt={x.name} />
          ) : (
            <span className="resource-photo-empty">
              <ImagePlus size={17} />
            </span>
          ),
      },
      { key: "gender", label: "Giới tính", render: (x) => labels[x.gender] },
      { key: "defaultCapacity", label: "Sức chứa" },
      { key: "fee", label: "Phí / tháng", render: (x) => money(x.fee) },
      { key: "status", label: "Trạng thái", render: (x) => badge(x.status) },
    ],
  },
  periods: {
    title: "Kỳ thu",
    singular: "kỳ thu",
    api: "periods",
    icon: ClipboardList,
    fields: [
      { label: "Kỳ (YYYY-MM)", name: "month", type: "month", required: true },
      { label: "Ngày lập", name: "issueDate", type: "date", required: true },
      {
        label: "Hạn thanh toán",
        name: "dueDate",
        type: "date",
        required: true,
      },
      {
        label: "Trạng thái",
        name: "status",
        required: true,
        options: [
          { value: "ACTIVE", label: "Đang sử dụng" },
          { value: "INACTIVE", label: "Đã đóng" },
        ],
      },
    ],
    columns: [
      { key: "month", label: "Kỳ thu" },
      { key: "issueDate", label: "Ngày lập", render: (x) => date(x.issueDate) },
      {
        key: "dueDate",
        label: "Hạn thanh toán",
        render: (x) => date(x.dueDate),
      },
      { key: "status", label: "Trạng thái", render: (x) => badge(x.status) },
    ],
  },
};

resourceConfig["billing-cycles"] = resourceConfig.periods;

export default function ResourcePage({ kind, type }) {
  const rawKind = kind || type;
  const resolvedKind = rawKind === "billing-cycles" ? "periods" : rawKind;
  const config = resourceConfig[resolvedKind] || resourceConfig.buildings;
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [edit, setEdit] = useState(null),
    [deleteModal, setDeleteModal] = useState(null),
    [deleteBusy, setDeleteBusy] = useState(false),
    [deleteError, setDeleteError] = useState(""),
    [message, notice, clear] = useNotice();
  const data = useLoad(
    `/${config.api}?page=${page}&search=${encodeURIComponent(search)}`,
  );
  const save = async (v, targetId = edit?.id) => {
    const saved = await api(`/${config.api}${targetId ? `/${targetId}` : ""}`, {
      method: targetId ? "PATCH" : "POST",
      body: v,
    });
    if (kind !== "room-types") setEdit(null);
    data.load();
    notice(`Đã lưu ${config.singular}.`);
    return saved;
  };
  const handleDeleteResource = async () => {
    if (!deleteModal) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await api(`/${config.api}/${deleteModal.id}`, { method: "DELETE" });
      notice(
        `Đã xóa ${config.singular} "${deleteModal.name || deleteModal.code}" thành công.`,
      );
      setDeleteModal(null);
      setEdit(null);
      data.load();
    } catch (err) {
      setDeleteError(err.message || `Không thể xóa ${config.singular}.`);
    } finally {
      setDeleteBusy(false);
    }
  };
  return (
    <>
      <PageTitle
        kicker="DANH MỤC HỆ THỐNG"
        title={config.title}
        description={`Quản lý và cập nhật thông tin ${config.singular} của ký túc xá.`}
        action={
          <button
            className="button button-primary"
            onClick={() => setEdit({ status: "ACTIVE" })}
          >
            <Plus size={17} />
            Thêm {config.singular}
          </button>
        }
      />
      <Section
        title={`Danh sách ${config.title.toLowerCase()}`}
        subtitle={`${data.data?.total || 0} mục`}
      >
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        {data.loading ? (
          <Loading />
        ) : data.data?.items?.length ? (
          <>
            <Table
              items={data.data.items}
              columns={[
                ...config.columns,
                {
                  key: "edit",
                  label: "",
                  render: (x) => (
                    <button className="table-action" onClick={() => setEdit(x)}>
                      Chỉnh sửa
                    </button>
                  ),
                },
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={config.icon} />
        )}
      </Section>
      {edit && (
        <Modal
          title={`${edit.id ? "Cập nhật" : "Thêm"} ${config.singular}`}
          onClose={() => setEdit(null)}
          wide={kind === "room-types"}
        >
          {kind === "room-types" ? (
            <RoomTypeEditor
              key={edit.id || "new"}
              initial={edit}
              fields={config.fields}
              onSaveType={save}
              onChanged={data.load}
              onClose={() => setEdit(null)}
              onDelete={
                edit?.id
                  ? () => {
                      setDeleteError("");
                      setDeleteModal(edit);
                    }
                  : undefined
              }
              deleteLabel={`Xóa ${config.singular.toLowerCase()}`}
            />
          ) : (
            <Form
              fields={config.fields}
              initial={edit}
              onSave={save}
              onCancel={() => setEdit(null)}
              onDelete={
                edit?.id
                  ? () => {
                      setDeleteError("");
                      setDeleteModal(edit);
                    }
                  : undefined
              }
              deleteLabel={`Xóa ${config.singular.toLowerCase()}`}
            />
          )}
        </Modal>
      )}
      {deleteModal && (
        <Modal
          title={`Xác nhận xóa ${config.singular}: ${deleteModal.name || deleteModal.code} (${deleteModal.code})`}
          onClose={() => {
            if (!deleteBusy) {
              setDeleteModal(null);
              setDeleteError("");
            }
          }}
        >
          <div style={{ padding: "4px 0" }}>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              Bạn có chắc chắn muốn xóa {config.singular}{" "}
              <strong>{deleteModal.name || deleteModal.code}</strong> không?
            </p>
            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "8px",
                padding: "12px 14px",
                color: "#9f1239",
                fontSize: "13px",
                lineHeight: "1.55",
              }}
            >
              <strong>
                Quy định an toàn & điều kiện xóa {config.singular}:
              </strong>
              <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                <li>
                  {config.singular.charAt(0).toUpperCase() +
                    config.singular.slice(1)}{" "}
                  <strong>
                    chỉ được phép xóa khi không còn sinh viên nào đang lưu trú
                  </strong>{" "}
                  trong các phòng liên quan.
                </li>
                <li>
                  Không có hồ sơ sinh viên hay yêu cầu chuyển phòng chờ xử lý
                  liên quan.
                </li>
                {kind === "room-types" ? (
                  <li>
                    Không còn phòng nào đang được gán loại phòng này.
                  </li>
                ) : (
                  <li>
                    Nếu các phòng đều trống và không có ràng buộc, hệ thống sẽ tự
                    động dọn dẹp các phòng trống trực thuộc.
                  </li>
                )}
                <li>Hành động này không thể hoàn tác sau khi thực hiện.</li>
              </ul>
            </div>
            {deleteError && (
              <div className="inline-error" style={{ marginTop: "12px" }}>
                {deleteError}
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-ghost"
              onClick={() => {
                setDeleteModal(null);
                setDeleteError("");
              }}
              disabled={deleteBusy}
            >
              Hủy
            </button>
            <button
              type="button"
              className="button button-danger"
              style={{
                background: "#dc2626",
                color: "#ffffff",
                borderColor: "#dc2626",
              }}
              disabled={deleteBusy}
              onClick={handleDeleteResource}
            >
              <Trash2 size={15} />
              {deleteBusy ? "Đang kiểm tra và xóa..." : "Xác nhận xóa"}
            </button>
          </div>
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}
