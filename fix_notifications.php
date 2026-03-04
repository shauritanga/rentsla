<?php
// Fix notifications with missing message field in data

use Illuminate\Support\Facades\DB;

$notifications = DB::table('notifications')->get();
foreach ($notifications as $n) {
    $data = json_decode($n->data, true);
    if (!is_array($data)) $data = [];
    if (empty($data['message'])) {
        $data['message'] = 'You have a new notification.';
        DB::table('notifications')->where('id', $n->id)->update([
            'data' => json_encode($data),
        ]);
        echo "Fixed notification {$n->id}\n";
    }
}
echo "Done.\n";
