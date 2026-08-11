"use client";

import React from 'react';
import PullToRefreshLib from 'react-simple-pull-to-refresh';

export default function PullToRefresh({ children, onRefresh }: { children: React.ReactNode, onRefresh: () => Promise<void> }) {
    return (
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fafafa]">
            <PullToRefreshLib onRefresh={onRefresh} pullingContent={
                <div className="flex justify-center p-4">
                    <span className="material-icons text-red-600 animate-bounce">arrow_downward</span>
                </div>
            }>
                <>{children}</>
            </PullToRefreshLib>
        </div>
    );
}
