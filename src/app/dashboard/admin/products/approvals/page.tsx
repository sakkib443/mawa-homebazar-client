"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuCheck, LuX, LuSearch, LuPackage, LuClock, LuCircleCheck, LuCircleX, LuExternalLink,
} from 'react-icons/lu';
import {
    useGetModerationProductsQuery,
    useApproveProductMutation,
    useRejectProductMutation,
} from '@/redux/api/productApi';
import { toast } from 'react-hot-toast';

/* ─── Styles ─── */
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };

const TABS = [
    { key: 'pending', label: 'Pending', Icon: LuClock, color: '#d97706' },
    { key: 'approved', label: 'Approved', Icon: LuCircleCheck, color: '#16a34a' },
    { key: 'rejected', label: 'Rejected', Icon: LuCircleX, color: '#dc2626' },
] as const;

const bdt = (n: number) => `৳${Number(n || 0).toLocaleString('en-BD')}`;

const ProductApprovalsPage = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading, isFetching } = useGetModerationProductsQuery({ approvalStatus: activeTab, limit: 100 });
    const [approveProduct, { isLoading: isApproving }] = useApproveProductMutation();
    const [rejectProduct, { isLoading: isRejecting }] = useRejectProductMutation();

    // Response shape: { data: { products: [...], meta: {...} } }
    const products = data?.data?.products || [];
    const busy = isApproving || isRejecting;

    const filtered = products.filter((p: any) => {
        // This queue is about company submissions — skip admin's own listings
        // (which are auto-approved and have no company attached).
        if (!p.company) return false;
        const q = searchTerm.toLowerCase();
        return (
            (p.name || '').toLowerCase().includes(q) ||
            (p.company?.name || '').toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q)
        );
    });

    const handleApprove = async (p: any) => {
        try {
            await approveProduct({ id: p._id }).unwrap();
            toast.success(`"${p.name}" approved — now live`);
        } catch (e: any) {
            toast.error(e?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async (p: any) => {
        const note = window.prompt(`Reject "${p.name}"?\n\nOptional note to the company (why it was rejected):`, '');
        if (note === null) return; // cancelled
        try {
            await rejectProduct({ id: p._id, note }).unwrap();
            toast.success(`"${p.name}" rejected`);
        } catch (e: any) {
            toast.error(e?.data?.message || 'Failed to reject');
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '14px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0 }}>Product Approvals</h1>
                <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>
                    Review products submitted by companies. Approve to make them live on the storefront, or reject with a note.
                </p>
            </div>

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', borderBottom: '1.5px solid #f0f0f0', flexWrap: 'wrap' }}>
                {TABS.map(({ key, label, Icon, color }) => {
                    const active = activeTab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '9px 16px', background: 'transparent',
                                border: 'none', borderBottom: active ? `2.5px solid ${color}` : '2.5px solid transparent',
                                marginBottom: '-1.5px', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 700,
                                color: active ? color : '#888',
                            }}
                        >
                            <Icon size={15} /> {label}
                            {key === activeTab && !isLoading && (
                                <span style={{
                                    fontSize: '10px', fontWeight: 800, padding: '1px 7px', borderRadius: '999px',
                                    background: `${color}18`, color,
                                }}>
                                    {filtered.length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
                <LuSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                <input
                    type="text"
                    placeholder="Search by product, company or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inp, paddingLeft: '34px' }}
                />
            </div>

            {/* List */}
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden', opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                    </div>
                ) : filtered.length > 0 ? (
                    <div>
                        {filtered.map((p: any, i: number) => (
                            <div key={p._id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                                padding: '12px 16px',
                                borderBottom: i < filtered.length - 1 ? '1px solid #f5f5f5' : 'none',
                                flexWrap: 'wrap',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                                    <div style={{
                                        width: '46px', height: '46px', borderRadius: '8px',
                                        background: '#f5f5f5', flexShrink: 0, overflow: 'hidden',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {p.thumbnail
                                            ? <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <LuPackage size={18} color="#bbb" />}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '340px' }}>
                                            {p.name}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px',
                                                background: '#eef2ff', color: '#6366f1',
                                            }}>
                                                {p.company?.name || 'Unknown company'}
                                            </span>
                                            {p.category?.name && (
                                                <span style={{ fontSize: '11px', color: '#999' }}>{p.category.name}</span>
                                            )}
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{bdt(p.price)}</span>
                                        </div>
                                        {p.approvalNote && activeTab === 'rejected' && (
                                            <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0' }}>Note: {p.approvalNote}</p>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <Link
                                        href={`/products/${p.slug || p._id}`}
                                        target="_blank"
                                        title="Preview on storefront"
                                        style={{
                                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '7px',
                                            color: '#64748b', textDecoration: 'none',
                                        }}
                                    >
                                        <LuExternalLink size={14} />
                                    </Link>

                                    {activeTab !== 'approved' && (
                                        <button onClick={() => handleApprove(p)} disabled={busy} style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '8px 14px', background: '#16a34a', color: '#fff',
                                            border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                                            cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
                                        }}>
                                            <LuCheck size={14} /> Approve
                                        </button>
                                    )}
                                    {activeTab !== 'rejected' && (
                                        <button onClick={() => handleReject(p)} disabled={busy} style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '8px 14px', background: '#fef2f2', color: '#dc2626',
                                            border: '1px solid #fecaca', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                                            cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
                                        }}>
                                            <LuX size={14} /> Reject
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--color-primary-lightest) 0%, var(--color-primary-light) 100%)',
                            boxShadow: 'inset 0 0 0 1px var(--color-primary-border)', marginBottom: '18px',
                        }}>
                            <LuPackage size={30} color="var(--color-primary)" />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
                            {activeTab === 'pending' ? 'No products waiting for approval' : `No ${activeTab} products`}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '340px', lineHeight: 1.5 }}>
                            {activeTab === 'pending'
                                ? 'When a company submits a new product, it shows up here for you to approve or reject.'
                                : 'Nothing to show in this list yet.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductApprovalsPage;
